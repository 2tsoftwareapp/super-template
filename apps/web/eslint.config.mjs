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
]);
