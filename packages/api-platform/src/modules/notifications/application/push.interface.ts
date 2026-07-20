import type { JsonObject } from '@repo/api-core';
export interface PushMessage {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  data?: JsonObject | null;
}

export const PUSH_NOTIFIER = Symbol('PUSH_NOTIFIER');

export interface PushNotifier {
  sendToUser(userId: string, message: PushMessage): Promise<void>;
  sendToToken(token: string, message: PushMessage): Promise<PushSendResult>;
}

export interface PushSendResult {
  success: boolean;
  providerMessageId: string | null;
  error?: string;
}
