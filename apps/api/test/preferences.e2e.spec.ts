import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, loginAs, resetTestDatabase } from './support/test-app';

describe('User preferences (e2e)', () => {
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

  it('returns default preferences for a user who has never customized them', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me/preferences')
      .set(bearer(session.accessToken))
      .expect(200);

    expect(response.body.data).toMatchObject({
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notificationPreferences: { email: true, push: true },
      emailPreferences: {},
    });
  });

  it('updates preferences and then resets them back to defaults', async () => {
    const session = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const updateResponse = await request(app.getHttpServer())
      .patch('/api/v1/users/me/preferences')
      .set(bearer(session.accessToken))
      .send({
        theme: 'dark',
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        notificationPreferences: { email: false, push: false },
        emailPreferences: { digest: false },
      })
      .expect(200);

    expect(updateResponse.body.data).toMatchObject({
      theme: 'dark',
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      notificationPreferences: { email: false, push: false },
      emailPreferences: { digest: false },
    });

    const getAfterUpdate = await request(app.getHttpServer())
      .get('/api/v1/users/me/preferences')
      .set(bearer(session.accessToken))
      .expect(200);

    expect(getAfterUpdate.body.data).toMatchObject({
      theme: 'dark',
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
    });

    const resetResponse = await request(app.getHttpServer())
      .delete('/api/v1/users/me/preferences')
      .set(bearer(session.accessToken))
      .expect(200);

    expect(resetResponse.body.data).toMatchObject({
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notificationPreferences: { email: true, push: true },
      emailPreferences: {},
    });

    const getAfterReset = await request(app.getHttpServer())
      .get('/api/v1/users/me/preferences')
      .set(bearer(session.accessToken))
      .expect(200);

    expect(getAfterReset.body.data).toMatchObject({
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
    });
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me/preferences')
      .expect(401);
  });
});
