// The checkable half of AGENTS.md: types, error handling, sizes, feature boundaries.
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/next-env.d.ts",
      "**/components/ui/**",
      "apps/mobile/**",
      "docs/.vitepress/cache/**",
      "docs/.vitepress/dist/**",
      "packages/db/migrations/**",
      "storage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: false }],
      // Prettier owns line breaks.
      "no-unexpected-multiline": "off",
      complexity: ["error", 10],
      "max-params": ["error", 4],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["apps/api/src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*/*.repository", "../*/*.repository.js"],
              message: "Cross-feature access goes through the other feature's exported service.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/admin/**/*.tsx", "apps/web/**/*.tsx"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["**/__tests__/**", "**/test/**", "**/*.spec.ts"],
    rules: { "max-lines-per-function": "off" },
  },
);
