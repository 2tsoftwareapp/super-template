import { NestFactory } from '@nestjs/core';
import { seedDatabase } from '@repo/api-bootstrap';

import { AppModule } from '../app.module';
import { loadCliEnv } from './load-cli-env';

loadCliEnv();

const main = async (): Promise<void> => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    await seedDatabase(app);
  } finally {
    await app.close();
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
