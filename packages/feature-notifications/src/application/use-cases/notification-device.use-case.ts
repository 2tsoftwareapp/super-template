import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@repo/api-runtime";
import { AppError } from "@repo/api-runtime";
import { NOTIFICATION_ERROR_CODES } from "@repo/feature-notifications/contracts";

import type { RegisterDeviceCommand } from "../notifications.types";

import {
  DEVICE_TOKENS_REPOSITORY,
  type DeviceTokensRepositoryPort,
} from "../ports/device-tokens.repository.port";

@Injectable()
export class NotificationDeviceUseCase {
  constructor(
    @Inject(DEVICE_TOKENS_REPOSITORY)
    private readonly deviceTokensRepository: DeviceTokensRepositoryPort,
  ) {}

  async registerDevice(user: AuthenticatedRequestUser, input: RegisterDeviceCommand) {
    const result = await this.deviceTokensRepository.registerOrTransfer({
      userId: user.userId,
      token: input.token,
      platform: input.platform,
    });

    if (!result) {
      // Lock unavailable → delivery processor is currently sending to this token.
      // A brief retry at the HTTP level is safe; return a 409 so the client can retry.
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        "Device token is temporarily locked by an in-progress delivery; please retry",
        HttpStatus.CONFLICT,
      );
    }

    const deviceToken = result.token;

    return {
      id: deviceToken.id,
      platform: deviceToken.platform,
      token: deviceToken.token,
      lastUsedAt: deviceToken.lastUsedAt.toISOString(),
    };
  }

  async unregisterDevice(user: AuthenticatedRequestUser, token: string) {
    const deviceToken = await this.deviceTokensRepository.disableByToken(
      user.userId,
      token,
      "User unregistered device",
    );

    if (!deviceToken) {
      throw new AppError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_DEVICE_NOT_FOUND,
        "Device token not found",
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
