// Runtime-agnostic JSON value model shared by the web BFF and the NestJS API.
// No framework, DOM, or Node-only APIs — safe to import from both runtimes.

export type JsonPrimitive = string | number | boolean | null;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export function isJsonObject(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isJsonObject(value) && Object.values(value).every(isJsonValue);
}

export function parseJsonValue(input: string): JsonValue {
  try {
    const parsed: unknown = JSON.parse(input);
    return isJsonValue(parsed) ? parsed : input;
  } catch {
    return input;
  }
}
