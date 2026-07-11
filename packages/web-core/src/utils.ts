import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { getCsrfCookieName } from "./http-config";
import { safeCookies } from "./storage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCsrfTokenFromDocument = (): string | null => {
  const cookieName = getCsrfCookieName();
  return safeCookies.getItem(cookieName);
};
