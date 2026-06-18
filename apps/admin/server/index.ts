import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "./app";
import { env } from "./env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = createApp();
  const httpServer = createHttpServer(app);

  if (env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(env.ADMIN_PORT, () => {
    console.log(`Admin listening on http://localhost:${env.ADMIN_PORT}`);
  });
}

void main();
