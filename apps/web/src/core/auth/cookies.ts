import { authRuntime } from "@/core/auth/runtime";

export {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/core/auth/cookie-names";

export const {
  createCsrfToken,
  isValidCsrfToken,
  readAuthCookies,
  setAuthCookies,
  setCsrfCookie,
  clearSessionCookies,
  clearAuthCookies,
} = authRuntime;
