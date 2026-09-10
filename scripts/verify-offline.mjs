import { spawnSync } from "node:child_process";

const result = spawnSync("sh", ["scripts/verify.sh"], {
  env: { ...process.env, VERIFY_SKIP_API_E2E: "1" },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
