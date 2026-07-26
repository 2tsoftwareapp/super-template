import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';

async function main() {
  console.log('starting');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  console.log('finished');
  await app.close();
}
main().catch(console.error);
