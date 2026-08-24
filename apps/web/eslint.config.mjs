import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "@repo/eslint-config/next";

const featureAppBoundaryPattern = {
  group: ["@/app/*", "@/app/**", "**/app/**"],
  message: "features/** must not import from app/**; dependency points app → feature.",
};

const featureDeepAliasBoundaryPattern = {
  group: ["@/features/*/*", "@/features/*/*/**"],
  message:
    "Do not deep-import feature internals through @/features. Same-feature internals use relative imports; cross-feature consumers use @/features/<feature> public contract.",
};

const featureBasePatterns = [featureAppBoundaryPattern, featureDeepAliasBoundaryPattern];

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
    name: "web/boundary-features",
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: featureBasePatterns,
        },
      ],
    },
  },
  {
    name: "web/boundary-config-layer",
    files: ["src/features/*/config/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: [
                "react",
                "react-dom",
                "next/navigation",
                "@tanstack/react-query",
                "swr",
                "@/core/*",
                "@/core/**",
                "**/core/*",
                "**/core/**",
                "**/api/*",
                "**/api/**",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
                "**/state/*",
                "**/state/**",
              ],
              message:
                "config/ is deterministic static feature configuration. It must not depend on runtime/application/presentation/state layers.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-ui-layer",
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: ["@tanstack/react-query", "swr", "next/navigation"],
              message:
                "UI components are presentational. Move querying/routing to the feature controller/application layer.",
            },
            {
              group: ["**/api/*", "**/api/**", "**/controllers/*", "**/controllers/**"],
              message:
                "UI must not depend on API/controllers. Use props and neutral feature contracts.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-screen-layer",
    files: ["src/features/*/screens/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: [
                "@tanstack/react-query",
                "swr",
                "@/core/http",
                "**/api/*",
                "**/api/**",
              ],
              message:
                "screens/ compose controllers and UI; they must not own data fetching or call the API layer directly.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-controller-layer",
    files: ["src/features/*/controllers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: ["**/ui/*", "**/ui/**", "**/screens/*", "**/screens/**"],
              message:
                "Controllers orchestrate behavior and produce contracts; they must not import UI/screens.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-state-layer",
    files: ["src/features/*/state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: [
                "next/navigation",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
              ],
              message:
                "state/ owns feature state only; it must not depend on orchestration or presentation layers.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-model-layer",
    files: ["src/features/*/model/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: ["react", "react-dom", "next/*", "@tanstack/react-query", "swr"],
              message: "model/ must remain framework-free and side-effect free.",
            },
            {
              group: [
                "@/core/*",
                "@/core/**",
                "**/api/*",
                "**/api/**",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
                "**/state/*",
                "**/state/**",
              ],
              message:
                "model/ must not depend on infrastructure, application, state, or presentation layers.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-contracts-layer",
    files: ["src/features/*/contracts/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: [
                "react",
                "react-dom",
                "next/*",
                "@tanstack/react-query",
                "swr",
                "@/core/*",
                "@/core/**",
                "**/api/*",
                "**/api/**",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
                "**/state/*",
                "**/state/**",
              ],
              message:
                "contracts/ must contain neutral data contracts only; no framework, infrastructure, state, or layer implementation dependencies.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-api-layer",
    files: ["src/features/*/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBasePatterns,
            {
              group: [
                "next/navigation",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
                "**/state/*",
                "**/state/**",
              ],
              message:
                "api/ is an integration boundary; it must not depend on orchestration, state, routing, or presentation layers.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "web/boundary-api-no-notifications",
    files: ["src/features/*/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message:
                "api/ must not raise toasts. Surface the failure and let the controller/application layer decide.",
            },
          ],
          patterns: [
            ...featureBasePatterns,
            {
              group: [
                "next/navigation",
                "**/controllers/*",
                "**/controllers/**",
                "**/screens/*",
                "**/screens/**",
                "**/ui/*",
                "**/ui/**",
                "**/state/*",
                "**/state/**",
              ],
              message:
                "api/ is an integration boundary; it must not depend on orchestration, state, routing, or presentation layers.",
            },
          ],
        },
      ],
    },
  },
  {
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
