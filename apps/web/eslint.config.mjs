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
    // and HTTP live in features/** (see CODING_RULES.md §3).
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
                "Route files must not use react-query directly. Move queries/mutations into features/<resource>/api/ (see CODING_RULES.md §3).",
            },
            {
              name: "@/lib/http",
              message:
                "Route files must not fetch directly. Move the call into features/<resource>/api/*.api.ts (see CODING_RULES.md §3).",
            },
          ],
          patterns: [
            {
              group: ["@/features/*/api/*", "@/features/*/controllers/*"],
              message:
                "Route files must not import from features sub-layers directly. Import a Screen component only (see CODING_RULES.md §3).",
            },
          ],
        },
      ],
    },
  },
  {
    // Architecture boundary: features must never depend on route files.
    // See CODING_RULES.md §10 dependency matrix.
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
                "features/** must not import from app/** — the dependency points the other way (see CODING_RULES.md §10).",
            },
          ],
        },
      ],
    },
  },
  {
    // Architecture boundary: UI components are pure presentational — must not
    // fetch data or access the api/ or controllers/ layers directly.
    // See CODING_RULES.md §8.
    // NOTE: severity is "warn" (not "error") because pre-existing code may have
    // violations. New code must not add new violations; migrate existing ones
    // gradually (promote to "error" once clean).
    name: "web/boundary-ui-layer",
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@tanstack/react-query", "swr"],
              message:
                "UI components must not fetch data. Move data fetching to features/<resource>/controllers/ (see CODING_RULES.md §8).",
            },
            {
              group: ["@/features/*/api/*"],
              message:
                "UI components must not import from the api/ layer. Only screens/controllers import from api/ (see CODING_RULES.md §8 R3).",
            },
            {
              group: ["@/features/*/controllers/*"],
              message:
                "UI components must not import handlers. Screens wire handlers → UI (see CODING_RULES.md §8 R3).",
            },
          ],
        },
      ],
    },
  },
  {
    // Architecture boundary: model/ is the pure domain layer — no React, no
    // API calls, no side effects. See CODING_RULES.md §7.
    // NOTE: severity is "warn" — same migration strategy as boundary-ui-layer above.
    name: "web/boundary-model-layer",
    files: ["src/features/*/model/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next/*"],
              message:
                "model/ files must not import React or Next.js (see CODING_RULES.md §7 R1).",
            },
            {
              group: ["@/features/*/api/*", "@/features/*/controllers/*", "@/features/*/screens/*", "@/features/*/ui/*"],
              message:
                "model/ must not import from other feature sub-layers (see CODING_RULES.md §7 R4).",
            },
          ],
        },
      ],
    },
  },
  {
    // Architecture boundary: lib/ is infrastructure — must not import from features/.
    // See CODING_RULES.md §9.2.
    name: "web/boundary-lib",
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message:
                "lib/ must not import from features/ — dependency points the other way (see CODING_RULES.md §9.2).",
            },
          ],
        },
      ],
    },
  },
  {
    // Layering: toast/notification side effects belong to the handler layer.
    // api/ hooks re-throw or expose state; they never talk to the user.
    // See CODING_RULES.md §6 R3 and §18.4.
    name: "web/boundary-api-no-notifications",
    files: ["src/features/*/api/**/*.{ts,tsx}"],
    rules: {
      // NOTE: severity is "warn" — 8 pre-existing *.mutations.ts files raise
      // toasts from api/. Promote to "error" once they are migrated.
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "sonner",
              message:
                "api/ must not raise toasts. Surface the error state and let the handler decide (see CODING_RULES.md §18.4).",
            },
          ],
        },
      ],
    },
  },
  {
    // Shared hooks must stay flat: a hook in src/hooks/ may not call another
    // shared hook or reach into a feature. Composition happens at the root
    // handler, which passes results down. See CODING_RULES.md §16.
    name: "web/shared-hooks-flat",
    files: ["src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/hooks/*"],
              message:
                "A shared hook must not call another shared hook — that hides a second data source inside a leaf. Compose them in the root handler instead (see CODING_RULES.md §16 R2).",
            },
            {
              group: ["@/features/*"],
              message:
                "src/hooks/ is cross-feature infrastructure and must not depend on a feature (see CODING_RULES.md §9.1).",
            },
          ],
        },
      ],
    },
  },
  {
    // Validation lives in model/: schemas are declared once and reused by
    // handlers, forms, and param parsers. See CODING_RULES.md §15 R2.
    name: "web/validation-in-model",
    files: [
      "src/features/*/controllers/**/*.{ts,tsx}",
      "src/features/*/screens/**/*.{ts,tsx}",
      "src/features/*/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "zod",
              message:
                "Declare schemas in features/<resource>/model/*.schemas.ts and import the schema, not zod (see CODING_RULES.md §15 R2).",
            },
          ],
        },
      ],
    },
  },
  {
    // Raw search-param reads bypass validation entirely: `Number(sp.get("page"))`
    // yields NaN for `?page=xx`. Parse through the feature's param schema.
    // See CODING_RULES.md §15 R4.
    name: "web/params-must-be-parsed",
    files: [
      "src/features/*/controllers/**/*.{ts,tsx}",
      "src/features/*/screens/**/*.{ts,tsx}",
      "src/features/*/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          // Flags a raw read; a read passed straight into a validator
          // (internalPath(...), parseXSearchParams(...)) is fine.
          selector:
            ":not(CallExpression[callee.name=/^(internalPath|parse[A-Z])/]) > CallExpression[callee.type='MemberExpression'][callee.property.name='get'][callee.object.name='searchParams']",
          message:
            "Do not read search params directly. Parse them through the feature's schema in model/*.search-params.ts so invalid values fall back instead of reaching the query (see CODING_RULES.md §15 R4).",
        },
      ],
    },
  },
]);
