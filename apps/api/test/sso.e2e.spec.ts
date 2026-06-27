import type { INestApplication } from '@nestjs/common';

import { ERROR_CODES } from '@repo/api-core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, loginAs, resetTestDatabase } from './support/test-app';

const REDIRECT_URI = 'http://localhost:3000/sso/callback';

const requireLocation = (location: string | undefined): string => {
  if (!location) {
    throw new Error('Response was missing a Location header');
  }

  return location;
};

const exchangeSession = async (app: INestApplication, code: string) => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/sso/exchange')
    .send({ code })
    .expect(201);

  return {
    accessToken: response.body.data.accessToken as string,
    refreshToken: response.body.data.refreshToken as string,
  };
};

describe('SSO (e2e, fake provider)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.SSO_FAKE_PROVIDER_ENABLED = 'true';
    await resetTestDatabase();
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const startLogin = async (email?: string) => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/start')
      .query({
        redirectUri: REDIRECT_URI,
        ...(email ? { testEmail: email } : {}),
      })
      .expect(200);

    const authorizationUrl = new URL(response.body.data.authorizationUrl);
    return {
      code: authorizationUrl.searchParams.get('code')!,
      state: authorizationUrl.searchParams.get('state')!,
    };
  };

  it('rejects an unknown provider on start', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/sso/not-a-provider/start')
      .query({ redirectUri: REDIRECT_URI })
      .expect(404)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.SSO_PROVIDER_UNAVAILABLE);
      });
  });

  it('rejects a redirectUri outside the allowed web origin', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/start')
      .query({ redirectUri: 'http://evil.example.com/callback' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.SSO_INVALID_REDIRECT);
      });
  });

  it('signs up a new user, then links subsequent logins by email', async () => {
    const email = 'sso-new-user@example.test';

    const first = await startLogin(email);
    const firstCallback = await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .query({ code: first.code, state: first.state })
      .expect(302);

    const firstLocation = new URL(requireLocation(firstCallback.headers.location));
    expect(firstLocation.origin + firstLocation.pathname).toBe(REDIRECT_URI);
    const firstExchangeCode = firstLocation.searchParams.get('exchange')!;
    expect(firstExchangeCode).toBeTruthy();

    const { accessToken: firstAccessToken } = await exchangeSession(
      app,
      firstExchangeCode,
    );

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(bearer(firstAccessToken))
      .expect(200);
    expect(meResponse.body.data.user.email).toBe(email);
    const firstUserId = meResponse.body.data.user.id as string;

    const second = await startLogin(email);
    const secondCallback = await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .query({ code: second.code, state: second.state })
      .expect(302);
    const secondExchangeCode = new URL(
      requireLocation(secondCallback.headers.location),
    ).searchParams.get('exchange')!;
    const { accessToken: secondAccessToken } = await exchangeSession(
      app,
      secondExchangeCode,
    );

    const secondMeResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(bearer(secondAccessToken))
      .expect(200);
    expect(secondMeResponse.body.data.user.id).toBe(firstUserId);
  });

  it('returns an exchange code when Accept is application/json', async () => {
    const { code, state } = await startLogin('sso-json@example.test');

    const callback = await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .set('Accept', 'application/json')
      .query({ code, state })
      .expect(200);

    expect(callback.body.data.exchangeCode).toBeTruthy();
    expect(callback.body.data.redirectUri).toBe(REDIRECT_URI);
    expect(callback.headers.location).toBeUndefined();
  });

  it('rejects replaying a consumed exchange code', async () => {
    const { code, state } = await startLogin('sso-replay-exchange@example.test');

    const callback = await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .query({ code, state })
      .expect(302);

    const exchangeCode = new URL(
      requireLocation(callback.headers.location),
    ).searchParams.get('exchange')!;

    await exchangeSession(app, exchangeCode);

    await request(app.getHttpServer())
      .post('/api/v1/auth/sso/exchange')
      .send({ code: exchangeCode })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.SSO_EXCHANGE_INVALID);
      });
  });

  it('rejects replaying a consumed state/code pair', async () => {
    const { code, state } = await startLogin('sso-replay@example.test');

    await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .query({ code, state })
      .expect(302);

    await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .query({ code, state })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.SSO_STATE_INVALID);
      });
  });

  it('rejects linking onto an existing unverified-email account', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');
    const conflictEmail = 'sso-conflict@example.test';

    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(admin.accessToken))
      .send({
        email: conflictEmail,
        password: 'ChangeMe123!',
        displayName: 'Conflict User',
        status: 'PENDING',
      })
      .expect(201);

    const { code, state } = await startLogin(conflictEmail);

    await request(app.getHttpServer())
      .get('/api/v1/auth/sso/fake/callback')
      .query({ code, state })
      .expect(409)
      .expect((res) => {
        expect(res.body.error.code).toBe(ERROR_CODES.SSO_EMAIL_CONFLICT);
      });
  });
});
