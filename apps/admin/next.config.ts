import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: [
    "@repo/web-ui",
    "@repo/web-hooks",
    "@repo/config",
    "@repo/env-loader",
  ],
};

export default withNextIntl(nextConfig);
