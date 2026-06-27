let csrfCookieName = "csrf_token";

export function configureHttpClient(options: { csrfCookieName?: string }) {
  if (options.csrfCookieName) {
    csrfCookieName = options.csrfCookieName;
  }
}

export function getCsrfCookieName(): string {
  return csrfCookieName;
}
