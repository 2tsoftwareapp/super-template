import { Test } from '@nestjs/testing';
import { EnvironmentService } from '@repo/api-core';
import { describe, expect, it } from 'vitest';
import { NotificationStreamService } from '../infrastructure/notification-stream.service';

describe('NotificationStreamService', () => {
  it('emits notification events to subscribed streams', async () => {
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
    const events: unknown[] = [];

    const subscription = service.stream('user-1').subscribe((event) => {
      events.push(event.data);
    });

    service.emit('user-1', {
      id: 'notification-1',
      userId: 'user-1',
      type: 'ops.alert',
      title: 'Hello',
      body: 'World',
      data: null,
      readAt: null,
      createdAt: '2026-06-16T00:00:00.000Z',
    });

    subscription.unsubscribe();

    expect(events).toEqual([
      {
        id: 'notification-1',
        userId: 'user-1',
        type: 'ops.alert',
        title: 'Hello',
        body: 'World',
        data: null,
        readAt: null,
        createdAt: '2026-06-16T00:00:00.000Z',
      },
    ]);
  });
});
