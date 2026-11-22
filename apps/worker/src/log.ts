type Level = "info" | "warn" | "error";
type Fields = Record<string, string | number | boolean | undefined>;

const json = process.env.NODE_ENV === "production";

/** JSON lines in production for log shippers; one readable line locally. */
export function log(level: Level, message: string, fields: Fields = {}): void {
  const line = json
    ? JSON.stringify({ level, time: new Date().toISOString(), message, ...fields })
    : `[worker] ${level.toUpperCase()} ${message} ${Object.entries(fields)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(" ")}`.trimEnd();

  (level === "error" ? console.error : console.log)(line);
}
