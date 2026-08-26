import { Test } from "@nestjs/testing";
import { EnvironmentService } from "@repo/api-runtime";
import { describe, expect, it } from "vitest";
import { NotificationStreamService } from "../notification-stream.service";

describe("NotificationStreamService", () => {
  it("emits notification events to subscribed streams, scoped per org", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationStreamService,
        {
          provide: EnvironmentService,
          useValue: { values: { REDIS_URL: undefined } },
        },
      ],
    }).compile();

    const service = moduleRef.get(NotificationStreamService);
    const org1Events: unknown[] = [];
    const org2Events: unknown[] = [];

    // Subscribe to org-1 and org-2 channels for the same user — they must remain isolated
    const sub1 = service.stream("user-1", "org-1").subscribe((event) => {
      org1Events.push(event);
    });
    const sub2 = service.stream("user-1", "org-2").subscribe((event) => {
      org2Events.push(event);
    });

    const baseEvent = {
      id: "notification-1",
      userId: "user-1",
      organizationId: "org-1",
      type: "ops.alert",
      title: "Hello",
      body: "World",
      data: null,
      readAt: null,
      createdAt: "2026-06-16T00:00:00.000Z",
    };

    service.emit("user-1", "org-1", baseEvent);

    sub1.unsubscribe();
    sub2.unsubscribe();

    // org-1 subscriber receives event; org-2 subscriber must NOT receive it (tenant isolation T-007)
    expect(org1Events).toEqual([baseEvent]);
    expect(org2Events).toEqual([]);
  });
});
