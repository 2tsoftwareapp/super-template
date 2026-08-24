import type { ResolvedTheme, Theme } from "./theme-contract";

export const THEME_STORAGE_KEY = "theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "light";
  } catch {
    return "light";
  }
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}
