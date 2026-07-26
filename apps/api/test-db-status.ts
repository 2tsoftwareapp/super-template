import { Client } from 'pg';
import { loadEnvFiles } from '@repo/api-core/config/load-env-files';

loadEnvFiles();
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TEST });
  await client.connect();
  const roles = await client.query('SELECT name, organization_id FROM roles');
  console.table(roles.rows);
  process.exit(0);
}
main();
