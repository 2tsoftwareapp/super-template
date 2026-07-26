import { createClient } from 'redis';

async function main() {
  console.log('Connecting to Redis...');
  const client = createClient({ url: 'redis://localhost:56379' });
  client.on('error', (err) => console.error('Redis Client Error', err));
  await client.connect();
  console.log('Connected!');
  await client.quit();
}
main().catch(console.error);
