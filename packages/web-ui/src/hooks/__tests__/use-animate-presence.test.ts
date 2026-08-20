// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimatePresence } from "../use-animate-presence";

describe("useAnimatePresence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts hidden when isOpen is false", () => {
    const { result } = renderHook(() => useAnimatePresence(false));
    expect(result.current.visible).toBe(false);
    expect(result.current.animate).toBe(false);
  });

  it("transitions to visible + animate on open", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useAnimatePresence(isOpen),
      { initialProps: { isOpen: false } },
    );

    expect(result.current.visible).toBe(false);

    // Open
    rerender({ isOpen: true });

    // After mount: visible becomes true
    expect(result.current.visible).toBe(true);
    // After double-rAF + timers: animate becomes true
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.animate).toBe(true);
  });

  it("transitions to hidden after close with delay", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useAnimatePresence(isOpen),
      { initialProps: { isOpen: true } },
    );

    // Open state
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.visible).toBe(true);
    expect(result.current.animate).toBe(true);

    // Close
    rerender({ isOpen: false });

    // animate becomes false immediately
    expect(result.current.animate).toBe(false);
    // visible stays true during transition
    expect(result.current.visible).toBe(true);

    // After durationMs (default 200ms): visible becomes false
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.visible).toBe(false);
  });

  it("respects custom durationMs", () => {
    const { result, rerender } = renderHook(
      ({ isOpen, durationMs }) => useAnimatePresence(isOpen, durationMs),
      { initialProps: { isOpen: true, durationMs: 500 } },
    );

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.visible).toBe(true);

    // Close
    rerender({ isOpen: false, durationMs: 500 });
    expect(result.current.visible).toBe(true);

    // After 200ms: still visible (custom duration is 500ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.visible).toBe(true);

    // After 500ms: hidden
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.visible).toBe(false);
  });

  it("cleans up timer on unmount", () => {
    const { result, rerender, unmount } = renderHook(
      ({ isOpen }) => useAnimatePresence(isOpen),
      { initialProps: { isOpen: true } },
    );

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.visible).toBe(true);

    // Close and immediately unmount before timer fires
    rerender({ isOpen: false });
    unmount();

    // No error thrown — timer was cleaned up
    act(() => {
      vi.advanceTimersByTime(500);
    });
  });

  it("cancels rAF on cleanup", () => {
    const { rerender, unmount } = renderHook(
      ({ isOpen }) => useAnimatePresence(isOpen),
      { initialProps: { isOpen: false } },
    );

    // Open then unmount before rAF fires
    rerender({ isOpen: true });
    unmount();

    // No error thrown — rAF was cancelled
    act(() => {
      vi.runAllTimers();
    });
  });
});
