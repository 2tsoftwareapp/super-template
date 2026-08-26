import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/admin/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "dist/**"],
  },
});
