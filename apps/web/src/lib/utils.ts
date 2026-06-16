import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCsrfTokenFromDocument = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith("csrf_token="));

  return entry ? decodeURIComponent(entry.split("=").slice(1).join("=")) : null;
};
