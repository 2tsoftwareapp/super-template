#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const baseUrl = process.env.PLAYWRIGHT_EXTENSION_MCP_URL ?? "http://localhost:9224/mcp";
const sessionCachePath =
  process.env.PLAYWRIGHT_EXTENSION_SESSION_FILE ??
  "/tmp/playwright-extension-live-browser-session.json";
const argv = process.argv.slice(2).filter((arg) => arg !== "--");
const planPath = argv[0];

if (!planPath) {
  console.error("Usage: node run-plan.mjs <plan.json>");
  process.exit(1);
}

const parseSse = (body) => {
  const match = body.match(/data: (.+)$/m);
  if (!match) {
    throw new Error(`No SSE data in response: ${body.slice(0, 500)}`);
  }
  return JSON.parse(match[1]);
};

const readSseEvent = async (response) => {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
        const eventIndex = buffer.indexOf("\n\n");
        if (eventIndex !== -1) {
          return buffer.slice(0, eventIndex);
        }
      }
      if (done) {
        break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Ignore stream cancellation failures.
    }
  }

  return buffer;
};

const post = async (body, sessionId) => {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await readSseEvent(response);
  return { response, text };
};

const parseTabsText = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^- \d+:/.test(line))
    .map((line) => {
      const match = /^- (\d+):(?: \(current\))? (.+)$/.exec(line);
      if (!match) {
        return null;
      }

      return {
        index: Number.parseInt(match[1], 10),
        descriptor: match[2],
      };
    })
    .filter(Boolean);

const extractTabsFromResult = (result) => {
  const textBlocks = result?.result?.content
    ?.filter((entry) => entry.type === "text")
    ?.map((entry) => entry.text) ?? [];

  return textBlocks.flatMap(parseTabsText);
};

const isConnectDescriptor = (descriptor) => descriptor.includes("chrome-extension://") && descriptor.includes("/connect.html?");

const readCachedSession = async () => {
  try {
    return JSON.parse(await readFile(sessionCachePath, "utf8"));
  } catch {
    return null;
  }
};

const writeCachedSession = async (sessionId) => {
  await mkdir(dirname(sessionCachePath), { recursive: true });
  await writeFile(
    sessionCachePath,
    JSON.stringify(
      {
        sessionId,
        baseUrl,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
};

const initialize = async () => {
  const { response, text } = await post({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: {
        name: "codex-skill-runner",
        version: "1.0",
      },
    },
  });

  const sessionId = response.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error("Missing MCP session id");
  }

  await post(
    {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    },
    sessionId,
  );

  return {
    sessionId,
    initializeResult: parseSse(text),
    reused: false,
  };
};

const rawCallTool = async (sessionId, id, name, args) => {
  const { text } = await post(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name,
        arguments: args ?? {},
      },
    },
    sessionId,
  );

  return parseSse(text);
};

const extractResultText = (result) =>
  result?.result?.content
    ?.filter((entry) => entry.type === "text")
    ?.map((entry) => entry.text)
    ?.join("\n") ?? "";

const extractPageUrl = (result) => {
  const text = extractResultText(result);
  const match = text.match(/- Page URL: (.+)/);
  return match?.[1]?.trim() ?? null;
};

const isRecoverableToolFailure = (value) => {
  const message =
    value instanceof Error ? value.message : extractResultText(value);

  return (
    message.includes("No SSE data in response") ||
    message.includes("Target page, context or browser has been closed") ||
    message.includes("Extension disconnected")
  );
};

const getOrCreateSession = async () => {
  const cached = await readCachedSession();
  if (cached?.sessionId && cached?.baseUrl === baseUrl) {
    try {
      const probe = await callTool(cached.sessionId, 0, "browser_tabs", { action: "list" });
      return {
        sessionId: cached.sessionId,
        initializeResult: {
          result: {
            protocolVersion: "reused",
            capabilities: { tools: {} },
            serverInfo: { name: "Browser Control", version: "reused-session" },
          },
          jsonrpc: "2.0",
          id: 0,
        },
        reused: true,
        probe,
      };
    } catch {
      // fall through to fresh initialize
    }
  }

  const initialized = await initialize();
  await writeCachedSession(initialized.sessionId);
  return initialized;
};

const plan = JSON.parse(await readFile(planPath, "utf8"));
const steps = Array.isArray(plan.steps) ? plan.steps : [];
const cleanupMode = plan.cleanup ?? "created-tabs";

if (!steps.length) {
  console.error("Plan must contain a non-empty steps array");
  process.exit(1);
}

if (!["created-tabs", "none"].includes(cleanupMode)) {
  console.error('cleanup must be "created-tabs" or "none"');
  process.exit(1);
}

const { sessionId, initializeResult, reused, probe } = await getOrCreateSession();
let activeSessionId = sessionId;
let lastKnownPageUrl = null;
let lastKnownViewport = null;
const cleanupState = {
  initialDescriptors: new Set(),
  initialIndexes: new Set(),
  createdDescriptors: new Set(),
  initialConnectDescriptors: new Set(),
  initialConnectIndexes: new Set(),
  closedConnectDescriptors: new Set(),
  trackingEnabled: true,
};

const restoreViewport = async () => {
  if (!lastKnownViewport) {
    return;
  }

  const restoreResult = await rawCallTool(activeSessionId, 899_999, "browser_resize", lastKnownViewport);

  console.log(
    JSON.stringify(
      {
        type: "session-restored-viewport",
        viewport: lastKnownViewport,
        result: restoreResult,
      },
      null,
      2,
    ),
  );
};

const restoreLastKnownPage = async () => {
  if (!lastKnownPageUrl) {
    return;
  }

  const restoreResult = await rawCallTool(activeSessionId, 900_000, "browser_navigate", {
    url: lastKnownPageUrl,
  });

  console.log(
    JSON.stringify(
      {
        type: "session-restored-page",
        url: lastKnownPageUrl,
        result: restoreResult,
      },
      null,
      2,
    ),
  );
};

const reinitializeSession = async (reason) => {
  const initialized = await initialize();
  activeSessionId = initialized.sessionId;
  await writeCachedSession(activeSessionId);

  console.log(
    JSON.stringify(
      {
        type: "session-reinitialized",
        reason,
        sessionId: activeSessionId,
        result: initialized.initializeResult,
      },
      null,
      2,
    ),
  );

  await restoreViewport();
  await restoreLastKnownPage();
};

const callTool = async (id, name, args, attempt = 0) => {
  try {
    const result = await rawCallTool(activeSessionId, id, name, args);
    lastKnownPageUrl = extractPageUrl(result) ?? lastKnownPageUrl;
    if (name === "browser_resize" && typeof args?.width === "number" && typeof args?.height === "number") {
      lastKnownViewport = { width: args.width, height: args.height };
    }
    if (attempt === 0 && result?.result?.isError && isRecoverableToolFailure(result)) {
      await reinitializeSession(`recoverable-tool-error:${name}`);
      return callTool(id, name, args, attempt + 1);
    }

    return result;
  } catch (error) {
    if (attempt === 0 && isRecoverableToolFailure(error)) {
      await reinitializeSession(`recoverable-exception:${name}`);
      return callTool(id, name, args, attempt + 1);
    }

    throw error;
  }
};

console.log(
  JSON.stringify(
    {
      type: "initialize",
      sessionId,
      reused,
      result: initializeResult,
    },
    null,
    2,
  ),
);

const inventoryResult = probe ?? (await callTool(2, "browser_tabs", { action: "list" }));
const initialTabs = extractTabsFromResult(inventoryResult);

if (inventoryResult.result?.isError || !initialTabs.length) {
  cleanupState.trackingEnabled = false;
} else {
  for (const tab of initialTabs) {
    cleanupState.initialDescriptors.add(tab.descriptor);
    cleanupState.initialIndexes.add(tab.index);
    if (isConnectDescriptor(tab.descriptor)) {
      cleanupState.initialConnectDescriptors.add(tab.descriptor);
      cleanupState.initialConnectIndexes.add(tab.index);
    }
  }
}

console.log(
  JSON.stringify(
    {
      type: "tool",
      id: 2,
      tool: "browser_tabs",
      args: { action: "list" },
      result: inventoryResult,
    },
    null,
    2,
  ),
);

const refreshCreatedTabs = (result) => {
  if (!cleanupState.trackingEnabled) {
    return;
  }

  for (const tab of extractTabsFromResult(result)) {
    if (cleanupState.initialIndexes.has(tab.index)) {
      continue;
    }
    if (cleanupState.initialConnectIndexes.has(tab.index)) {
      continue;
    }
    if (!cleanupState.initialDescriptors.has(tab.descriptor)) {
      cleanupState.createdDescriptors.add(tab.descriptor);
    }
  }
};

const closeHandshakeTabsIfPossible = async (sessionId, id, inventoryResult) => {
  if (!cleanupState.trackingEnabled) {
    return;
  }

  const tabs = extractTabsFromResult(inventoryResult);
  const nonConnectTabs = tabs.filter((tab) => !isConnectDescriptor(tab.descriptor));
  const connectTabs = tabs.filter(
    (tab) =>
      cleanupState.initialConnectDescriptors.has(tab.descriptor) &&
      !cleanupState.closedConnectDescriptors.has(tab.descriptor),
  );

  if (!nonConnectTabs.length || !connectTabs.length) {
    return;
  }

  for (const tab of [...connectTabs].sort((a, b) => b.index - a.index)) {
    const closeResult = await callTool(id + tab.index, "browser_tabs", {
      action: "close",
      index: tab.index,
    });
    cleanupState.closedConnectDescriptors.add(tab.descriptor);
    console.log(
      JSON.stringify(
        {
          type: "cleanup-close-connect-tab",
          index: tab.index,
          descriptor: tab.descriptor,
          result: closeResult,
        },
        null,
        2,
      ),
    );
  }
};

const syncTabInventory = async (sessionId, id) => {
  const inventoryResult = await callTool(id, "browser_tabs", { action: "list" });
  refreshCreatedTabs(inventoryResult);

  console.log(
    JSON.stringify(
      {
        type: "inventory-sync",
        id,
        result: inventoryResult,
      },
      null,
      2,
    ),
  );

  await closeHandshakeTabsIfPossible(sessionId, id + 100, inventoryResult);
};

const closeCreatedTabs = async () => {
  if (cleanupMode !== "created-tabs" || !cleanupState.trackingEnabled || !cleanupState.createdDescriptors.size) {
    if (cleanupMode === "created-tabs" && !cleanupState.trackingEnabled) {
      console.log(
        JSON.stringify(
          {
            type: "cleanup-skipped",
            reason: "initial-tab-inventory-unavailable",
          },
          null,
          2,
        ),
      );
    }
    return;
  }

  const finalTabs = await callTool(10_000, "browser_tabs", { action: "list" });
  const currentCreated = extractTabsFromResult(finalTabs)
    .filter((tab) => cleanupState.createdDescriptors.has(tab.descriptor))
    .sort((a, b) => b.index - a.index);

  console.log(
    JSON.stringify(
      {
        type: "cleanup-inventory",
        result: finalTabs,
      },
      null,
      2,
    ),
  );

  for (const tab of currentCreated) {
    const closeResult = await callTool(10_001 + tab.index, "browser_tabs", {
      action: "close",
      index: tab.index,
    });

    console.log(
      JSON.stringify(
        {
          type: "cleanup-close-tab",
          index: tab.index,
          descriptor: tab.descriptor,
          result: closeResult,
        },
        null,
        2,
      ),
    );
  }
};

let failed = false;

try {
  for (const [index, step] of steps.entries()) {
    const id = step.id ?? index + 3;
    const result = await callTool(id, step.tool, step.args ?? {});
    refreshCreatedTabs(result);

    console.log(
      JSON.stringify(
        {
          type: "tool",
          id,
          tool: step.tool,
          args: step.args ?? {},
          result,
        },
        null,
        2,
      ),
    );

    if (result.result?.isError || result.result?.content?.isError || result.isError) {
      throw new Error(`Tool failed: ${step.tool}`);
    }

    await syncTabInventory(sessionId, 20_000 + index);
  }
} catch (error) {
  failed = true;
  console.error(
    JSON.stringify(
      {
        type: "run-error",
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
} finally {
  await closeCreatedTabs();
}

if (failed) {
  process.exit(1);
}
