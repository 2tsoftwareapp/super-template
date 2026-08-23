import { defineConfig, globalIgnores } from "eslint/config";

import { baseConfig } from "./packages/eslint-config/base.mjs";

// Bounded-context boundary inside apps/api: a context may import the other
// context's STABLE SURFACE ONLY (port tokens, domain policies, constants).
// Services, use-cases, controllers, repositories and Module classes are off-limits.
// NOTE: no bare-`${alias}` entry here — in gitignore semantics a directory
// pattern bans everything beneath it, which would also ban the allowed
// stable surface below.
const ctxForbidden = (alias) => [
  `${alias}/**/*service*`,
  `${alias}/**/*use-case*`,
  `${alias}/**/infrastructure/**`,
  `${alias}/**/presentation/**`,
  `${alias}/**/*.module.ts`,
  `${alias}/**/index.ts`,
];
const identityPlatformRestriction = (dir, otherAlias) => ({
  files: [`apps/api/src/${dir}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: ctxForbidden(otherAlias).map((group) => ({
          group: [group],
          message:
            "Cross-context access is limited to the other context's stable surface: application/ports, domain and constants files.",
        })),
      },
    ],
  },
});

export default defineConfig([
  ...baseConfig,
  identityPlatformRestriction("identity", "@platform"),
  identityPlatformRestriction("platform", "@identity"),
  globalIgnores([
    "**/dist/**",
    "**/coverage/**",
    "**/node_modules/**",
    "packages/api-contract/src/generated/**",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
    "apps/api/vitest.config.ts",
    "apps/api/webpack.config.js",
    "packages/web-ui/vitest.config.ts",
    "packages/web-hooks/vitest.config.ts",
    "packages/api-core/vitest.config.ts",
    "eslint.config.mjs",
  ]),
]);
