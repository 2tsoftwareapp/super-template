import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { getCsrfCookieName } from "./http-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCsrfTokenFromDocument = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieName = getCsrfCookieName();
  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${cookieName}=`));

  return entry ? decodeURIComponent(entry.split("=").slice(1).join("=")) : null;
};
