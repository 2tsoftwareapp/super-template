import { Inject, Injectable } from '@nestjs/common';

import type { AppEnvironment } from './env.schema';

import { APP_ENVIRONMENT } from './config.constants';

@Injectable()
export class EnvironmentService {
  constructor(@Inject(APP_ENVIRONMENT) private readonly env: AppEnvironment) {}

  get values(): AppEnvironment {
    return this.env;
  }

  get isProduction(): boolean {
    return this.env.APP_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.APP_ENV === 'test';
  }

  get corsOrigins(): string[] {
    return this.env.WEB_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}
