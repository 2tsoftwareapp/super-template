import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { randomUUID } from "node:crypto";

import {
  callBackend,
  enforceCsrf,
  proxyWithRefresh,
  refreshSession,
  sendForbidden,
} from "./backend";
import { clearAuthCookies, readAuthCookies, setAuthCookies } from "./cookies";

const parseJson = async <T>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
};

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cookieParser());
  app.use("/api/v1", express.raw({ type: "*/*", limit: "1mb" }));

  app.post("/api/v1/auth/login", async (req, res) => {
    const response = await callBackend({
      path: "auth/login",
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: Buffer.isBuffer(req.body) ? req.body : undefined,
    });

    const payload = await parseJson<{
      data?: { accessToken: string; refreshToken: string };
    }>(response);

    if (response.ok && payload?.data?.accessToken && payload.data.refreshToken) {
      setAuthCookies(res, {
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
      });
    } else {
      clearAuthCookies(res);
    }

    res.status(response.status).json(payload);
  });

  app.post("/api/v1/auth/logout", async (req, res) => {
    const { accessToken } = readAuthCookies(req);

    if (accessToken) {
      const response = await callBackend({
        path: "auth/logout",
        method: "POST",
        headers: new Headers(),
        accessToken,
      });
      const payload = await parseJson(response);
      clearAuthCookies(res);
      res.status(response.status).json(payload);
      return;
    }

    clearAuthCookies(res);
    res.json({ data: { success: true }, meta: { requestId: randomUUID() } });
  });

  app.post("/api/v1/auth/refresh", async (req, res) => {
    const { refreshToken, csrfToken } = readAuthCookies(req);

    if (!refreshToken) {
      clearAuthCookies(res);
      res.status(401).json({
        error: {
          code: "AUTH_UNAUTHORIZED",
          message: "Refresh token is missing",
          details: null,
        },
        meta: { requestId: randomUUID() },
      });
      return;
    }

    const refreshed = await refreshSession(refreshToken);

    if (!refreshed) {
      clearAuthCookies(res);
      res.status(401).json({
        error: {
          code: "AUTH_SESSION_REVOKED",
          message: "Unable to refresh session",
          details: null,
        },
        meta: { requestId: randomUUID() },
      });
      return;
    }

    setAuthCookies(res, refreshed.data, csrfToken ?? undefined);
    res.json(refreshed);
  });

  app.use("/api/v1", async (req, res) => {
    const pathWithQuery = req.url.replace(/^\/+/, "");
    const barePath = pathWithQuery.split("?")[0] ?? "";

    if (barePath.includes("..")) {
      sendForbidden(res, { code: "AUTH_FORBIDDEN", message: "Invalid proxy path" });
      return;
    }

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrfFailure = enforceCsrf(req);
      if (csrfFailure) {
        sendForbidden(res, csrfFailure);
        return;
      }
    }

    await proxyWithRefresh(req, res, pathWithQuery);
  });

  return app;
}
