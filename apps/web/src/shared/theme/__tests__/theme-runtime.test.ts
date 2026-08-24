import { afterEach, describe, expect, it, vi } from "vitest";

import { getStoredTheme, resolveTheme, THEME_STORAGE_KEY } from "../theme-runtime";

describe("theme runtime", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("preserves the system theme preference across reloads", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");

    expect(getStoredTheme()).toBe("system");
  });

  it("resolves system theme from the browser preference", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);

    expect(resolveTheme("system")).toBe("dark");
  });
});
