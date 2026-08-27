
// AppError is the canonical typed failure for domain and application-layer rules.
// The global exception filter turns it into a stable JSON contract for clients.
// statusCode is a numeric HTTP status (no Nest dependency in the kernel).
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly details: unknown = null,
  ) {
    super(message);
  }
}
