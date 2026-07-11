import "@testing-library/jest-dom/vitest";

// jsdom does not implement ResizeObserver (needed by input-otp and popover
// positioning); provide a no-op stub for component smoke tests.
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
