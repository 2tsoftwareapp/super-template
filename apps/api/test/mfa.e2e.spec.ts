import type { INestApplication } from '@nestjs/common';

import { ERROR_CODES } from '@repo/api-core';
import { DATABASE, users } from '@repo/api-database';
import {
  base32Decode,
  generateTotpCode,
} from '@repo/api-identity/modules/mfa/domain/totp';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, loginAs, resetTestDatabase } from './support/test-app';

describe('Two-factor authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await resetTestDatabase();
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createActiveUser = async (
    admin: { accessToken: string },
    email: string,
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(admin.accessToken))
      .send({
        email,
        password: 'ChangeMe123!',
        displayName: 'MFA Test User',
        status: 'ACTIVE',
      })
      .expect(201);

    const userId = response.body.data.id as string;

    // Admin-created users must change their password on first login; the MFA
    // lifecycle below is unrelated to that gate, so clear it like the other
    // e2e specs that exercise admin-created users.
    await app
      .get(DATABASE)
      .update(users)
      .set({ mustChangePassword: false })
      .where(eq(users.id, userId));

    return userId;
  };

  it('runs the full setup, login-challenge, recovery-code, and disable lifecycle', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');
    const email = 'mfa-user@example.local';
    const password = 'ChangeMe123!';
    await createActiveUser(admin, email);

    const session = await loginAs(app, email, password);

    // Not enabled yet.
    const initialStatus = await request(app.getHttpServer())
      .get('/api/v1/auth/mfa/status')
      .set(bearer(session.accessToken))
      .expect(200);
    expect(initialStatus.body.data).toEqual({ enabled: false });

    // Setup returns a base32 secret usable to derive TOTP codes.
    const setupResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/setup')
      .set(bearer(session.accessToken))
      .expect(201);

    const { secret, otpauthUrl } = setupResponse.body.data as {
      secret: string;
      otpauthUrl: string;
    };
    expect(otpauthUrl).toContain('otpauth://totp/');
    const secretBuffer = base32Decode(secret);

    // Confirming with a bad code is rejected and leaves MFA unconfirmed.
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/confirm')
      .set(bearer(session.accessToken))
      .send({ code: '000000' })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.MFA_INVALID_CODE);
      });

    // Confirming with the right code enables MFA and returns one-time recovery codes.
    const confirmResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/confirm')
      .set(bearer(session.accessToken))
      .send({ code: generateTotpCode(secretBuffer) })
      .expect(201);

    const recoveryCodes = confirmResponse.body.data.recoveryCodes as string[];
    expect(recoveryCodes).toHaveLength(8);

    const enabledStatus = await request(app.getHttpServer())
      .get('/api/v1/auth/mfa/status')
      .set(bearer(session.accessToken))
      .expect(200);
    expect(enabledStatus.body.data).toEqual({ enabled: true });

    // Logging in now stops short of issuing a session and instead returns a challenge token.
    const challengeLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    expect(challengeLogin.body.data.mfaRequired).toBe(true);
    expect(challengeLogin.body.data.accessToken).toBeUndefined();
    const mfaToken = challengeLogin.body.data.mfaToken as string;
    expect(mfaToken).toBeTruthy();

    // Wrong code against the challenge is rejected.
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify-challenge')
      .send({ mfaToken, code: '000000' })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.MFA_INVALID_CODE);
      });

    // Correct TOTP code against the challenge completes login with a full session.
    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify-challenge')
      .send({ mfaToken, code: generateTotpCode(secretBuffer) })
      .expect(201);

    expect(verifyResponse.body.data.accessToken).toBeTruthy();
    expect(verifyResponse.body.data.user.email).toBe(email);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(bearer(verifyResponse.body.data.accessToken))
      .expect(200);

    // A spent challenge token cannot be replayed.
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify-challenge')
      .send({ mfaToken, code: generateTotpCode(secretBuffer) })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.MFA_CHALLENGE_INVALID);
      });

    // A recovery code can substitute for a TOTP code during a login challenge.
    const secondChallengeLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const secondMfaToken = secondChallengeLogin.body.data.mfaToken as string;
    const usedRecoveryCode = recoveryCodes[0]!;

    const recoveryVerifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify-challenge')
      .send({ mfaToken: secondMfaToken, code: usedRecoveryCode })
      .expect(201);
    expect(recoveryVerifyResponse.body.data.accessToken).toBeTruthy();

    // The same recovery code cannot be reused.
    const thirdChallengeLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const thirdMfaToken = thirdChallengeLogin.body.data.mfaToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/verify-challenge')
      .send({ mfaToken: thirdMfaToken, code: usedRecoveryCode })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.MFA_INVALID_CODE);
      });

    // Regenerating recovery codes invalidates the old set.
    const regenerateResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/recovery-codes/regenerate')
      .set(bearer(verifyResponse.body.data.accessToken))
      .send({ code: generateTotpCode(secretBuffer) })
      .expect(201);
    const newRecoveryCodes = regenerateResponse.body.data
      .recoveryCodes as string[];
    expect(newRecoveryCodes).toHaveLength(8);
    expect(newRecoveryCodes).not.toEqual(recoveryCodes);

    // Disabling requires a valid code and removes the secret entirely.
    await request(app.getHttpServer())
      .post('/api/v1/auth/mfa/disable')
      .set(bearer(verifyResponse.body.data.accessToken))
      .send({ code: generateTotpCode(secretBuffer) })
      .expect(201);

    const disabledStatus = await request(app.getHttpServer())
      .get('/api/v1/auth/mfa/status')
      .set(bearer(verifyResponse.body.data.accessToken))
      .expect(200);
    expect(disabledStatus.body.data).toEqual({ enabled: false });

    // Logging in now completes immediately again, with no challenge step.
    const finalLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    expect(finalLogin.body.data.mfaRequired).toBe(false);
    expect(finalLogin.body.data.accessToken).toBeTruthy();
  });
});
