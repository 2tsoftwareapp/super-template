import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "@repo/eslint-config/next";

const featureAppBoundaryPattern = {
  group: ["@/app/*", "@/app/**", "**/app/**"],
  message: "features/** must not import from app/**; dependency points app → feature.",
};

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
    // Next.js route entries consume feature public contracts only.
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
                "Route files must not use react-query directly. Move data access into the feature application/API boundary.",
            },
            {
              name: "@/core/http",
              message:
                "Route files must not fetch directly. Consume the feature public contract instead.",
            },
          ],
          patterns: [
            {
              group: [
                "@/features/*/*",
                "@/features/*/*/**",
                "**/features/*/*",
                "**/features/*/*/**",
              ],
              message:
                "Route files must not deep-import feature internals. Import from @/features/<feature> (index.ts public contract).",
            },
          ],
        },
      ],
    },
  },
  {
    // Features never depend on the application routing composition root.
    name: "web/boundary-features",
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [featureAppBoundaryPattern],
        },
      ],
    },
  },
  {
    // Presentational UI receives data/actions; it does not own application workflows.
    name: "web/boundary-ui-layer",
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            featureAppBoundaryPattern,
            {
              group: ["@tanstack/react-query", "swr", "next/navigation"],
              message:
                "UI components are presentational. Move querying/routing to the feature controller/application layer.",
            },
            {
              group: [
                "@/features/*/api/*",
                "@/features/*/api/**",
                "@/features/*/controllers/*",
                "@/features/*/controllers/**",
                "**/api/*",
                "**/api/**",
                "**/controllers/*",
                "**/controllers/**",
              ],
              message:
                "UI must not depend on API/controllers. Use props and neutral feature contracts.",
            },
          ],
        },
      ],
    },
  },
  {
    // Controllers are the application layer and must not depend back on presentation implementation.
    name: "web/boundary-controller-layer",
    files: ["src/features/*/controllers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            featureAppBoundaryPattern,
            {
              group: [
                "@/features/*/ui/*",
                "@/features/*/ui/**",
                "@/features/*/screens/*",
                "@/features/*/screens/**",
                "**/ui/*",
                "**/ui/**",
                "**/screens/*",
                "**/screens/**",
              ],
              message:
                "Controllers orchestrate behavior and produce contracts; they must not import UI/screens.",
            },
          ],
        },
      ],
    },
  },
  {
    // model/ is optional pure domain/decision knowledge.
    name: "web/boundary-model-layer",
    files: ["src/features/*/model/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            featureAppBoundaryPattern,
            {
              group: ["react", "react-dom", "next/*", "@tanstack/react-query", "swr"],
              message: "model/ must remain framework-free and side-effect free.",
            },
            {
              group: [
                "@/core/*",
                "@/core/**",
                "@/features/*/api/*",
                "@/features/*/api/**",
                "@/features/*/controllers/*",
                "@/features/*/controllers/**",
                "@/features/*/screens/*",
                "@/features/*/screens/**",
                "@/features/*/ui/*",
                "@/features/*/ui/**",
                "**/api/*",
                "**/api/**",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
              ],
              message:
                "model/ must not depend on infrastructure, application, or presentation layers.",
            },
          ],
        },
      ],
    },
  },
  {
    // contracts/ is a neutral compile-time boundary between feature layers.
    name: "web/boundary-contracts-layer",
    files: ["src/features/*/contracts/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            featureAppBoundaryPattern,
            {
              group: [
                "react",
                "react-dom",
                "next/*",
                "@tanstack/react-query",
                "swr",
                "@/core/*",
                "@/core/**",
                "@/features/*/api/*",
                "@/features/*/api/**",
                "@/features/*/controllers/*",
                "@/features/*/controllers/**",
                "@/features/*/screens/*",
                "@/features/*/screens/**",
                "@/features/*/ui/*",
                "@/features/*/ui/**",
                "**/api/*",
                "**/api/**",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
              ],
              message:
                "contracts/ must contain neutral data contracts only; no framework, infrastructure, or layer implementation dependencies.",
            },
          ],
        },
      ],
    },
  },
  {
    // Reusable lower-scope layers never depend on business features.
    name: "web/boundary-core-shared",
    files: ["src/core/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**", "**/features/*", "**/features/**"],
              message: "core/shared must not import business features; dependency points the other way.",
            },
          ],
        },
      ],
    },
  },
  {
    // API adapters surface state/errors; user-facing notification policy belongs to application orchestration.
    name: "web/boundary-api-no-notifications",
    files: ["src/features/*/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "sonner",
              message:
                "api/ must not raise toasts. Surface the failure and let the controller/application layer decide.",
            },
          ],
          patterns: [featureAppBoundaryPattern],
        },
      ],
    },
  },
  {
    // Cross-feature shared hooks remain independent from feature implementations.
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
                "A shared hook must not hide another shared hook dependency. Compose them at the feature application boundary.",
            },
            {
              group: ["@/features/*", "@/features/**", "**/features/*", "**/features/**"],
              message: "src/hooks/ is cross-feature and must not depend on feature implementations.",
            },
          ],
        },
      ],
    },
  },
  {
    // Raw URL reads bypass bounded parsing and fallback behavior.
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
          selector:
            ":not(CallExpression[callee.name=/^(internalPath|parse[A-Z])/]) > CallExpression[callee.type='MemberExpression'][callee.property.name='get'][callee.object.name='searchParams']",
          message:
            "Do not read search params ad hoc. Parse them through a bounded feature route-input adapter (for example controllers/<feature>-search-params.ts).",
        },
      ],
    },
  },
]);
