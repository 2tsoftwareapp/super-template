/**
 * Refuse destructive CLI actions against staging/production unless an explicit
 * override env is set. Policy comments alone are not enough — ops mistakes are
 * common when APP_ENV is inherited from a shared secret store.
 */
export const assertDestructiveCliAllowed = (options: {
  action: string;
  overrideEnv: "ALLOW_PROD_SEED" | "ALLOW_PROD_RESET";
}): void => {
  const appEnv = process.env.APP_ENV ?? "development";
  const isDeployed = appEnv === "staging" || appEnv === "production";
  if (!isDeployed) {
    return;
  }

  const raw = process.env[options.overrideEnv]?.trim().toLowerCase();
  const allowed = raw === "1" || raw === "true" || raw === "yes";
  if (allowed) {
    return;
  }

  throw new Error(
    `Refusing to ${options.action} when APP_ENV=${appEnv}. ` +
      `Set ${options.overrideEnv}=1 to override (dangerous — creates/destroys data).`,
  );
};
