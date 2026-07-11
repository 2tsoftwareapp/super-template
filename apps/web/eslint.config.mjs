import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "@repo/eslint-config/next";

export default defineConfig([
  ...nextConfig,
  globalIgnores([
    ".next/**",
    "build/**",
    "eslint.config.mjs",
    "next-env.d.ts",
    "out/**",
    "postcss.config.mjs",
    "public/**",
  ]),
  {
    // Architecture boundary: route files are entry points only. Data fetching
    // and HTTP live in features/** (mirrors apps/admin — see its AGENTS.md).
    name: "web/boundary-app-router",
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@tanstack/react-query",
              message:
                "Route files must not use react-query directly. Move queries/mutations into features/<resource>/ and import the hook.",
            },
            {
              name: "@/lib/http",
              message:
                "Route files must not fetch directly. Move the call into a features/<resource>/*-service.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    // Architecture boundary: features must never depend on route files.
    name: "web/boundary-features",
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "**/app/**"],
              message:
                "features/** must not import from app/** — the dependency points the other way.",
            },
          ],
        },
      ],
    },
  },
]);
