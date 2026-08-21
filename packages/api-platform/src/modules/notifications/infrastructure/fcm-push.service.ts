import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-core";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import type { PushMessage, PushNotifier, PushSendResult } from "../application/ports/push.interface";

import {
  DEVICE_TOKENS_REPOSITORY,
  type DeviceTokensRepositoryPort,
} from "../application/ports/device-tokens.repository.port";

@Injectable()
export class FcmPushService implements PushNotifier {
  private readonly logger = new Logger(FcmPushService.name);
  private readonly app: App | null;

  constructor(
    private readonly environmentService: EnvironmentService,
    @Inject(DEVICE_TOKENS_REPOSITORY)
    private readonly deviceTokensRepository: DeviceTokensRepositoryPort,
  ) {
    const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = this.environmentService.values;

    if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
      this.app = null;
      return;
    }

    this.app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: FCM_PROJECT_ID,
          clientEmail: FCM_CLIENT_EMAIL,
          privateKey: FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
  }

  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    if (!this.app) {
      return;
    }

    const deviceTokens = await this.deviceTokensRepository.listByUserId(userId);

    if (deviceTokens.length === 0) {
      return;
    }

    const tokens = deviceTokens.map((deviceToken) => deviceToken.token);
    const response = await getMessaging(this.app).sendEachForMulticast({
      tokens,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: this.toFcmData(message),
    });

    const invalidTokens = response.responses.flatMap((result, index) => {
      const token = tokens[index];

      if (
        result.success ||
        result.error?.code !== "messaging/registration-token-not-registered" ||
        !token
      ) {
        return [];
      }

      return [token];
    });

    if (invalidTokens.length > 0) {
      await this.deviceTokensRepository.disableTokens(invalidTokens, "Invalid FCM token");
      this.logger.warn(`Removed ${invalidTokens.length} invalid FCM token(s) for user ${userId}`);
    }
  }

  async sendToToken(token: string, message: PushMessage): Promise<PushSendResult> {
    if (!this.app) {
      return { success: false, providerMessageId: null, error: "FCM not configured" };
    }

    try {
      const response = await getMessaging(this.app).send({
        token,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: this.toFcmData(message),
      });

      return { success: true, providerMessageId: response || null };
    } catch (error) {
      const errorCode = (error as { code?: string }).code ?? "";
      const isInvalidToken =
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token";

      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        providerMessageId: null,
        error: isInvalidToken ? "INVALID_TOKEN" : errorMessage,
      };
    }
  }

  private toFcmData(message: PushMessage): Record<string, string> {
    const data: Record<string, string> = {
      notificationId: message.notificationId,
      type: message.type,
    };

    if (message.data) {
      for (const [key, value] of Object.entries(message.data)) {
        data[key] = typeof value === "string" ? value : JSON.stringify(value ?? null);
      }
    }

    return data;
  }
}
