import type { ValidationPipeOptions } from '@nestjs/common';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EnvironmentService } from '@repo/api-core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { openApiSetup } from './openapi/open-api-setup';
import { logStartupWarnings } from './shell/startup-warnings';

const pipeConfigs: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Surface DI/module init failures (e.g. circular dependencies) with a real
    // error instead of a silent process.abort(). Mirrors the e2e test harness.
    abortOnError: false,
  });

  const environmentService = app.get(EnvironmentService);

  logStartupWarnings(environmentService);

  app.setGlobalPrefix('api/v1');
  app.use(json({ limit: environmentService.apiBodyLimit }));
  app.use(
    urlencoded({ extended: true, limit: environmentService.apiBodyLimit }),
  );
  app.use(helmet());
  app.enableCors({
    origin: environmentService.corsOrigins,
    credentials: true,
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe(pipeConfigs));

  openApiSetup(app, environmentService);

  await app.listen(environmentService.apiPort);
}

void bootstrap();
