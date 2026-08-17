import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnvironmentService } from "../../../config/environment.service";
import type { ErrorReportContext } from "../observability.types";

import { TelegramTransportService } from "../telegram-transport.service";

function makeService(values: Record<string, unknown>): TelegramTransportService {
  return new TelegramTransportService({
    values,
  } as unknown as EnvironmentService);
}

const context = {
  requestId: "req-1",
  errorCode: "INTERNAL_ERROR",
  statusCode: 500,
  method: "GET",
  path: "/things",
  userId: "user-1",
} as ErrorReportContext;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TelegramTransportService", () => {
  it("does nothing when bot token or chat id is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await makeService({
      TELEGRAM_ERROR_BOT_TOKEN: undefined,
      TELEGRAM_ERROR_BOT_CHAT_ID: undefined,
      TELEGRAM_ERROR_BOT_TIMEOUT_MS: 2000,
    }).send("boom", context);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a formatted message to the Telegram API when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await makeService({
      TELEGRAM_ERROR_BOT_TOKEN: "bot-token",
      TELEGRAM_ERROR_BOT_CHAT_ID: "chat-1",
      TELEGRAM_ERROR_BOT_TIMEOUT_MS: 2000,
    }).send("Something broke", context);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/botbot-token/sendMessage");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("chat-1");
    expect(body.text).toContain("Something broke");
    expect(body.text).toContain("code: INTERNAL_ERROR");
    expect(body.text).toContain("route: GET /things");
  });

  it("never throws when the network call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(
      makeService({
        TELEGRAM_ERROR_BOT_TOKEN: "bot-token",
        TELEGRAM_ERROR_BOT_CHAT_ID: "chat-1",
        TELEGRAM_ERROR_BOT_TIMEOUT_MS: 2000,
      }).send("boom", context),
    ).resolves.toBeUndefined();
  });
});
