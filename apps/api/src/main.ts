import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvironmentService } from '@repo/api-core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const environmentService = app.get(EnvironmentService);

  app.setGlobalPrefix('api/v1');
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.use(helmet());
  app.enableCors({
    origin: environmentService.corsOrigins,
    credentials: true,
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (
    environmentService.apiDocsEnabled &&
    !environmentService.isProduction
  ) {
    const config = new DocumentBuilder()
      .setTitle('Super Template API')
      .setDescription('Production-oriented starter API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    app
      .getHttpAdapter()
      .get(
        '/api/docs-json',
        (_request: unknown, response: { json: (body: unknown) => void }) => {
          response.json(document);
        },
      );
  }

  await app.listen(environmentService.apiPort);
}

void bootstrap();
