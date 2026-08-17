import js from "@eslint/js";
import globals from "globals";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    plugins: {
      perfectionist: perfectionistPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "allow",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "perfectionist/sort-exports": "error",
      "perfectionist/sort-imports": "error",
      "perfectionist/sort-named-exports": "error",
      "perfectionist/sort-named-imports": "error",
    },
  },
];
