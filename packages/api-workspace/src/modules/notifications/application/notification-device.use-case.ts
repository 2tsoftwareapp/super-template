import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { RegisterDeviceCommand } from './notifications.types';

import { DeviceTokensRepository } from '../infrastructure/device-tokens.repository';

@Injectable()
export class NotificationDeviceUseCase {
  constructor(
    private readonly deviceTokensRepository: DeviceTokensRepository,
  ) {}

  async registerDevice(
    user: AuthenticatedRequestUser,
    input: RegisterDeviceCommand,
  ) {
    const deviceToken = await this.deviceTokensRepository.upsert({
      userId: user.userId,
      token: input.token,
      platform: input.platform,
    });

    if (!deviceToken) {
      throw new Error('Device token upsert returned no rows');
    }

    return {
      id: deviceToken.id,
      platform: deviceToken.platform,
      token: deviceToken.token,
      lastUsedAt: deviceToken.lastUsedAt.toISOString(),
    };
  }

  async unregisterDevice(user: AuthenticatedRequestUser, token: string) {
    const deviceToken = await this.deviceTokensRepository.deleteByToken(
      user.userId,
      token,
    );

    if (!deviceToken) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_DEVICE_NOT_FOUND,
        'Device token not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
