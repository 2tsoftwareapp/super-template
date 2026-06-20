#!/usr/bin/env node

import { rm } from "node:fs/promises";

const sessionCachePath =
  process.env.PLAYWRIGHT_EXTENSION_SESSION_FILE ??
  "/tmp/playwright-extension-live-browser-session.json";

try {
  await rm(sessionCachePath, { force: true });
  console.log(`Removed session cache: ${sessionCachePath}`);
} catch (error) {
  console.error(
    `Failed to remove session cache ${sessionCachePath}: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
