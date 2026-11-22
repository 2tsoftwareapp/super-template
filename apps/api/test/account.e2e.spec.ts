import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { MailService } from "../src/modules/mail/mail.service";
import { NotificationsService } from "../src/modules/notifications/notifications.service";
import { InMemoryAuthRepository, PASSWORD, createTestApp, makeUser } from "./support";

class MailOutbox {
  readonly sent: Array<{ to: string; subject: string; text: string }> = [];

  async send(input: { to: string; subject: string; text: string }) {
    this.sent.push(input);
    return { jobId: crypto.randomUUID(), status: "PENDING" };
  }

  resetToken(): string {
    const match = /token=([\w-]+)/.exec(this.sent.at(-1)?.text ?? "");
    return match?.[1] ?? "";
  }
}

describe("account self-service (e2e)", () => {
  let app: INestApplication;
  const auth = new InMemoryAuthRepository();
  const outbox = new MailOutbox();
  const welcomed: string[] = [];

  beforeAll(async () => {
    app = await createTestApp(
      (builder) =>
        builder
          .overrideProvider(MailService)
          .useValue(outbox)
          .overrideProvider(NotificationsService)
          .useValue({ create: async (input: { userId: string }) => welcomed.push(input.userId) }),
      auth,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    outbox.sent.length = 0;
  });

  const http = () => request(app.getHttpServer());
  const login = (email: string, password: string) =>
    http().post("/api/v1/auth/login").send({ email, password });

  it("registers a USER, signs them in and sends a welcome notification", async () => {
    const response = await http()
      .post("/api/v1/auth/register")
      .send({ email: "New@Example.local", password: "Sup3rSecret!", displayName: " Ann " })
      .expect(201);

    expect(response.body.data.user).toMatchObject({
      email: "new@example.local",
      displayName: "Ann",
      role: "USER",
    });
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(welcomed).toContain(response.body.data.user.id);
  });

  it("answers a duplicate sign-up with 409 and rejects role escalation", async () => {
    await http()
      .post("/api/v1/auth/register")
      .send({ email: "member@example.local", password: "Sup3rSecret!", displayName: "M" })
      .expect(409)
      .expect((response) => expect(response.body.error.code).toBe("USER_EMAIL_TAKEN"));

    const escalated = await http()
      .post("/api/v1/auth/register")
      .send({ email: "x@example.local", password: "Sup3rSecret!", displayName: "X", role: "ADMIN" })
      .expect(400);

    expect(escalated.body.error.message).toContain("property role should not exist");
  });

  it("mails a one-time reset link that sets a new password and revokes old sessions", async () => {
    const user = auth.add(makeUser({ email: "reset@example.local" }));
    const before = (await login(user.email, PASSWORD).expect(200)).body.data;

    await http()
      .post("/api/v1/auth/forgot-password")
      .send({ email: "RESET@example.local" })
      .expect(202);
    expect(outbox.sent[0]?.to).toBe("reset@example.local");
    expect(outbox.sent[0]?.text).toContain("http://localhost:3000/reset-password?token=");

    const token = outbox.resetToken();
    await http()
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "BrandNew123!" })
      .expect(204);

    await http()
      .get("/api/v1/auth/me")
      .set("authorization", `Bearer ${before.accessToken}`)
      .expect(401);
    await login(user.email, PASSWORD).expect(401);
    await login(user.email, "BrandNew123!").expect(200);
    await http()
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: before.refreshToken })
      .expect(401);

    const reused = await http()
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "Another123!" })
      .expect(400);
    expect(reused.body.error.code).toBe("AUTH_RESET_TOKEN_INVALID");
  });

  it("gives the same answer for unknown and blocked emails without sending mail", async () => {
    auth.add(makeUser({ email: "blocked@example.local", status: "BLOCKED" }));

    for (const email of ["nobody@example.local", "blocked@example.local"]) {
      const response = await http()
        .post("/api/v1/auth/forgot-password")
        .send({ email })
        .expect(202);
      expect(response.body).toEqual({ data: { status: "queued" } });
    }

    expect(outbox.sent).toHaveLength(0);
  });

  it("rejects an expired reset token", async () => {
    const user = auth.add(makeUser({ email: "late@example.local" }));
    await http().post("/api/v1/auth/forgot-password").send({ email: user.email }).expect(202);
    const reset = auth.resets.at(-1);
    if (reset) reset.expiresAt = new Date(Date.now() - 1000);

    await http()
      .post("/api/v1/auth/reset-password")
      .send({ token: outbox.resetToken(), password: "BrandNew123!" })
      .expect(400);
  });

  it("changes the password with the current one and returns a fresh session", async () => {
    const user = auth.add(makeUser({ email: "change@example.local" }));
    const session = (await login(user.email, PASSWORD).expect(200)).body.data;
    const bearer = `Bearer ${session.accessToken}`;

    const wrong = await http()
      .post("/api/v1/auth/change-password")
      .set("authorization", bearer)
      .send({ currentPassword: "not-it", newPassword: "Changed123!" })
      .expect(400);
    expect(wrong.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");

    const changed = await http()
      .post("/api/v1/auth/change-password")
      .set("authorization", bearer)
      .send({ currentPassword: PASSWORD, newPassword: "Changed123!" })
      .expect(200);

    expect(changed.body.data.refreshToken).not.toBe(session.refreshToken);
    await http().get("/api/v1/auth/me").set("authorization", bearer).expect(401);
    await http()
      .get("/api/v1/auth/me")
      .set("authorization", `Bearer ${changed.body.data.accessToken}`)
      .expect(200);
    await http()
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: session.refreshToken })
      .expect(401);
    await login(user.email, "Changed123!").expect(200);
  });

  it("updates the display name of the signed-in user", async () => {
    const user = auth.add(makeUser({ email: "profile@example.local" }));
    const { accessToken } = (await login(user.email, PASSWORD).expect(200)).body.data;

    const response = await http()
      .patch("/api/v1/auth/me")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ displayName: "  Renamed " })
      .expect(200);

    expect(response.body.data.displayName).toBe("Renamed");
    await http().patch("/api/v1/auth/me").send({ displayName: "x" }).expect(401);
  });
});
