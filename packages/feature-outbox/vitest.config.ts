import { featureAliases } from "@repo/test-config/feature-aliases";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // @ts-expect-error oxc is a vite option not exposed by vitest types
  oxc: false,
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "src/__tests__/**/*.spec.ts", "test/**/*.spec.ts"],
  },
  resolve: {
    alias: featureAliases(),
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false,
      },
    },
  },
});
