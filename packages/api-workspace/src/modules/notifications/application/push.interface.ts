export interface PushMessage {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}

export const PUSH_NOTIFIER = Symbol('PUSH_NOTIFIER');

export interface PushNotifier {
  sendToUser(userId: string, message: PushMessage): Promise<void>;
}
