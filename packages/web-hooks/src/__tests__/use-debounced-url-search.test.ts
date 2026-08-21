// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedUrlSearch } from "../use-debounced-url-search";

describe("useDebouncedUrlSearch", () => {
  let mockReplaceSpy: ReturnType<typeof vi.fn>;
  let mockSearchParams: URLSearchParams;
  let mockPathname: string;

  function renderWithDefaults(
    overrides: Partial<Parameters<typeof useDebouncedUrlSearch>[0]> = {},
  ) {
    return renderHook(
      (opts) =>
        useDebouncedUrlSearch({
          searchParams: mockSearchParams,
          pathname: mockPathname,
          replace: mockReplaceSpy as (url: string) => void,
          ...opts,
        }),
      { initialProps: overrides },
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    mockReplaceSpy = vi.fn();
    mockSearchParams = new URLSearchParams();
    mockPathname = "/test";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string when URL param is absent", () => {
    const { result } = renderWithDefaults();
    expect(result.current.value).toBe("");
    expect(result.current.debouncedValue).toBe("");
  });

  it("returns default value when URL param is absent", () => {
    const { result } = renderWithDefaults({ defaultValue: "all" });
    expect(result.current.value).toBe("all");
    expect(result.current.debouncedValue).toBe("all");
  });

  it("reads initial value from URL", () => {
    mockSearchParams = new URLSearchParams("q=hello");
    const { result } = renderWithDefaults();
    expect(result.current.value).toBe("hello");
    expect(result.current.debouncedValue).toBe("hello");
  });

  it("reads from custom param name", () => {
    mockSearchParams = new URLSearchParams("search=world");
    const { result } = renderWithDefaults({ paramName: "search" });
    expect(result.current.value).toBe("world");
  });

  it("setValue updates value immediately", () => {
    const { result } = renderWithDefaults();
    expect(result.current.value).toBe("");

    act(() => {
      result.current.setValue("new search");
    });

    expect(result.current.value).toBe("new search");
    // Debounced value doesn't update yet
    expect(result.current.debouncedValue).toBe("");
  });

  it("debouncedValue updates after delay", () => {
    const { result } = renderWithDefaults({ debounceMs: 300 });

    act(() => {
      result.current.setValue("typed");
    });

    expect(result.current.debouncedValue).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedValue).toBe("typed");
  });

  it("writes to URL after debounce", () => {
    const { result } = renderWithDefaults({ debounceMs: 300 });

    act(() => {
      result.current.setValue("query");
    });

    // No URL update yet
    expect(mockReplaceSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplaceSpy).toHaveBeenCalledWith("/test?q=query");
  });

  it("removes param from URL when value is empty", () => {
    mockSearchParams = new URLSearchParams("q=old");
    const { result } = renderWithDefaults({ debounceMs: 300 });

    act(() => {
      result.current.setValue("");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplaceSpy).toHaveBeenCalledWith("/test");
  });

  it("does not write to URL when value matches URL", () => {
    mockSearchParams = new URLSearchParams("q=existing");
    const { result } = renderWithDefaults({ debounceMs: 300 });

    // setValue with same value as URL
    act(() => {
      result.current.setValue("existing");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should not call replace since value matches URL
    expect(mockReplaceSpy).not.toHaveBeenCalled();
  });

  it("preserves other URL params when writing", () => {
    mockSearchParams = new URLSearchParams("page=2&status=active");
    const { result } = renderWithDefaults({ debounceMs: 300 });

    act(() => {
      result.current.setValue("search term");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplaceSpy).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    expect(mockReplaceSpy).toHaveBeenCalledWith(expect.stringContaining("status=active"));
    expect(mockReplaceSpy).toHaveBeenCalledWith(expect.stringContaining("q=search+term"));
  });

  it("uses custom debounceMs", () => {
    const { result } = renderWithDefaults({ debounceMs: 500 });

    act(() => {
      result.current.setValue("slow");
    });

    // After 300ms: not yet
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedValue).toBe("");
    expect(mockReplaceSpy).not.toHaveBeenCalled();

    // After 500ms total: now
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedValue).toBe("slow");
    expect(mockReplaceSpy).toHaveBeenCalled();
  });

  it("syncs URL changes to local value", () => {
    mockSearchParams = new URLSearchParams("q=initial");
    const { result, rerender } = renderWithDefaults();

    expect(result.current.value).toBe("initial");

    // Simulate URL change (e.g. back button)
    mockSearchParams = new URLSearchParams("q=navigated");
    rerender({});

    expect(result.current.value).toBe("navigated");
  });
});
