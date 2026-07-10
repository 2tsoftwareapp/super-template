let csrfCookieName = "csrf_token";
let csrfBootstrapPath = "/api/auth/csrf";

export function configureHttpClient(options: {
  csrfCookieName?: string;
  csrfBootstrapPath?: string;
}) {
  if (options.csrfCookieName) {
    csrfCookieName = options.csrfCookieName;
  }

  if (options.csrfBootstrapPath) {
    csrfBootstrapPath = options.csrfBootstrapPath;
  }
}

export function getCsrfCookieName(): string {
  return csrfCookieName;
}

export function getCsrfBootstrapPath(): string {
  return csrfBootstrapPath;
}
