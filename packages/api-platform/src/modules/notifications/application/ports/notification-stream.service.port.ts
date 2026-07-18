import type { MessageEvent } from '@nestjs/common';
import type { JsonObject } from '@repo/api-core';
import type { Observable } from 'rxjs';

export interface NotificationStreamEvent {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: JsonObject | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationStreamServicePort {
  emit(userId: string, organizationId: string, event: NotificationStreamEvent): void;
  stream(userId: string, organizationId: string): Observable<MessageEvent>;
}

export const NOTIFICATION_STREAM_SERVICE = Symbol('NOTIFICATION_STREAM_SERVICE');
