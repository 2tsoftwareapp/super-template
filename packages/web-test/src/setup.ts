import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Unmount React trees after each test. Without vitest globals the
// testing-library auto-cleanup never registers, leaving scheduler callbacks
// alive past jsdom teardown ("window is not defined" flakes).
afterEach(() => {
  cleanup();
});

// jsdom polyfills shared by every web vitest run.

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// Needed by input-otp, popover positioning, and other size-aware primitives.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe(): void {
      // no-op: jsdom stub
    }
    unobserve(): void {
      // no-op: jsdom stub
    }
    disconnect(): void {
      // no-op: jsdom stub
    }
  }
  globalThis.ResizeObserver = ResizeObserverStub;
}
