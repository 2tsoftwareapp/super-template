/** Thrown by a handler when retrying cannot help (bad payload): the job fails at once. */
export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentJobError";
  }
}
