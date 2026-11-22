import type { NextConfig } from "next";

import { resolve } from "node:path";

const config: NextConfig = {
  // `next build` emits a self-contained server for the Docker image.
  output: "standalone",
  outputFileTracingRoot: resolve(__dirname, "../.."),
  poweredByHeader: false,
};

export default config;
