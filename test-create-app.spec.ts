import { createTestApp } from './apps/api/test/support/test-app';

async function main() {
  console.log('starting createTestApp');
  const app = await createTestApp();
  console.log('finished createTestApp');
  await app.close();
}
main().catch(console.error);
