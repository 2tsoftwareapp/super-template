/** Privileged connection for schema migrations and db:reset (superuser or owner). */
export const resolveMigrateDatabaseUrl = (): string => {
  const explicit = process.env.DATABASE_MIGRATE_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!database || !user || password === undefined) {
    throw new Error(
      'DATABASE_MIGRATE_URL is required when POSTGRES_* variables are incomplete. ' +
        'Point it at a privileged role (for example postgres) for migrate and reset.',
    );
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
};
