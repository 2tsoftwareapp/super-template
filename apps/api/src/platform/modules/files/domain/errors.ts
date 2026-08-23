/**
 * Thrown by the files infrastructure when a version insert collides with the
 * unique (file_id, version_number) index. The application layer maps it to a
 * soft 409 conflict instead of a 500 — concurrent uploads of the same version
 * are expected and retryable.
 */
export class FileVersionConflictError extends Error {
  constructor() {
    super("A file version was created concurrently with the same version number");
    this.name = "FileVersionConflictError";
  }
}
