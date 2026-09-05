/**
 * Shared-package layering rules (ARCHITECTURE_RULES §2.1).
 * Applied from the monorepo root eslint.config.mjs.
 */
export const webPackageBoundaryConfig = [
  {
    files: ["packages/web-ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@repo/web-utils/http",
              message:
                "@repo/web-ui must not fetch data. Use @repo/web-hooks or app Providers for CSRF/HTTP side effects.",
            },
            {
              name: "@tanstack/react-query",
              message: "@repo/web-ui is presentational — no data-fetching libraries.",
            },
          ],
          patterns: [
            {
              group: ["@repo/web-utils/http", "@repo/web-utils/http/*"],
              message:
                "@repo/web-ui must not fetch data. Use @repo/web-hooks or app Providers for CSRF/HTTP side effects.",
            },
            {
              group: [
                "@repo/api-kernel",
                "@repo/api-kernel/*",
                "@repo/api-runtime",
                "@repo/utils/password",
              ],
              message: "@repo/web-ui must not import backend kernel packages.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/web-hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@repo/web-ui",
              message: "@repo/web-hooks must not import UI components (dependency direction).",
            },
          ],
          patterns: [
            {
              group: ["@repo/web-ui", "@repo/web-ui/*"],
              message: "@repo/web-hooks must not import UI components (dependency direction).",
            },
            {
              group: [
                "@repo/api-kernel",
                "@repo/api-kernel/*",
                "@repo/api-runtime",
                "@repo/utils/password",
              ],
              message: "@repo/web-hooks must not import backend kernel packages.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/web-utils/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "@repo/web-utils must stay free of React (no components, no hooks).",
            },
            {
              name: "react-dom",
              message: "@repo/web-utils must stay free of React (no components, no hooks).",
            },
          ],
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "react-dom/*"],
              message: "@repo/web-utils must stay free of React (no components, no hooks).",
            },
            {
              group: ["@repo/web-ui", "@repo/web-ui/*", "@repo/web-hooks", "@repo/web-hooks/*"],
              message: "@repo/web-utils must not import web-ui or web-hooks.",
            },
            {
              group: [
                "@repo/api-kernel",
                "@repo/api-kernel/*",
                "@repo/api-runtime",
                "@repo/utils/password",
              ],
              message: "@repo/web-utils must not import backend kernel packages.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/web-server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@repo/web-ui", "@repo/web-ui/*", "@repo/web-hooks", "@repo/web-hooks/*"],
              message: "@repo/web-server is server-only — no UI or client hooks.",
            },
            {
              group: [
                "@repo/api-kernel",
                "@repo/api-kernel/*",
                "@repo/api-runtime",
                "@repo/utils/password",
              ],
              message: "@repo/web-server must not import Nest/api-kernel packages.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/utils/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "argon2",
              message:
                "Node-only crypto belongs in @repo/api-kernel (password helpers), not isomorphic @repo/utils.",
            },
            {
              name: "react",
              message: "@repo/utils must stay runtime-agnostic — no React.",
            },
            {
              name: "@nestjs/common",
              message: "@repo/utils must stay runtime-agnostic — no NestJS.",
            },
          ],
          patterns: [
            {
              group: ["node:*", "argon2", "react", "react-dom", "@nestjs/*"],
              message:
                "@repo/utils must stay runtime-agnostic (no Node-only, React, or Nest APIs).",
            },
          ],
        },
      ],
    },
  },
];
