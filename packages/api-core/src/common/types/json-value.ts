// Re-exported from the runtime-agnostic shared package so the NestJS API and the
// web BFF share a single JSON value model. See @repo/utils/json.
export type {
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
} from '@repo/utils/json';
export { isJsonObject, isJsonValue, parseJsonValue } from '@repo/utils/json';
