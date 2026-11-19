const normalizeKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Query keys whose values carry no credentials and stay readable in logs.
 * Everything else is replaced with `[REDACTED]`: callback endpoints put OAuth
 * codes and file-capability tokens in the query string.
 */
const LOGGABLE_QUERY_KEYS = new Set([
  "page",
  "pagesize",
  "limit",
  "sort",
  "order",
  "status",
  "entitytype",
  "entityid",
]);

const REDACT_KEY_NORMALIZED = new Set([
  "authorization",
  "cookie",
  "cookies",
  "password",
  "passwordhash",
  "newpassword",
  "oldpassword",
  "passwordconfirmation",
  "accesstoken",
  "refreshtoken",
  "token",
  "resettoken",
  "verificationtoken",
  "apikey",
  "clientsecret",
  "privatekey",
  "secretaccesskey",
  "secretkey",
  "secret",
  "mfastatus",
  "mfasecret",
  "otp",
  "otpsecret",
  "recoverycodes",
  "recoverycode",
]);

export const redactSensitive = (value: unknown): unknown =>
  redactInternal(value, new WeakSet<object>());

/**
 * Redact the query string of a request URL before it reaches a log sink.
 * Keeps the path and allow-listed filter/pagination keys, drops every value
 * that could be replayed (OAuth codes, state values, capability tokens, emails).
 */
export const redactRequestUrl = (url: string): string => {
  const queryIndex = url.indexOf("?");

  if (queryIndex === -1) {
    return url;
  }

  const path = url.slice(0, queryIndex);
  const params = new URLSearchParams(url.slice(queryIndex + 1));
  const safe = new URLSearchParams();

  for (const [key, value] of params) {
    safe.append(key, LOGGABLE_QUERY_KEYS.has(normalizeKey(key)) ? value : "[REDACTED]");
  }

  return `${path}?${safe.toString()}`;
};

const redactInternal = (value: unknown, seen: WeakSet<object>): unknown => {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    return value.map((item) => redactInternal(item, seen));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (REDACT_KEY_NORMALIZED.has(normalizeKey(key))) {
        return [key, "[REDACTED]"];
      }

      return [key, redactInternal(nestedValue, seen)];
    }),
  );
};
