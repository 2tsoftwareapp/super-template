#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import http from "node:http";
import { resolve } from "node:path";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createConnection } from "@playwright/mcp";

const port = Number.parseInt(process.env.EXTENSION_MCP_PORT ?? "9224", 10);
const host = process.env.EXTENSION_MCP_HOST ?? "127.0.0.1";
const outputDir = resolve(process.cwd(), "artifacts");

const sessions = new Map();

const readParsedBody = async (req) => {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return undefined;
  }

  return JSON.parse(rawBody);
};

const createSession = async () => {
  const server = await createConnection({
    extension: true,
    sharedBrowserContext: true,
    outputDir,
    server: { host, port },
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
    void server.close().catch(() => {});
  };

  return { server, transport };
};

await mkdir(outputDir, { recursive: true });

const httpServer = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);

    if (requestUrl.pathname !== "/mcp") {
      res.writeHead(404).end("Not found");
      return;
    }

    const parsedBody = await readParsedBody(req);
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    let session = sessionId ? sessions.get(sessionId) : undefined;
    let createdSession = false;

    if (!session) {
      if (sessionId) {
        res.writeHead(404).end("Unknown MCP session");
        return;
      }
      session = await createSession();
      createdSession = true;
    }

    await session.transport.handleRequest(req, res, parsedBody);

    if (createdSession && session.transport.sessionId) {
      sessions.set(session.transport.sessionId, session);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    res.end(message);
  }
});

httpServer.listen(port, host, () => {
  console.log(`Browser Control MCP listening on http://${host}:${port}/mcp`);
});

const closeServer = () => {
  httpServer.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
