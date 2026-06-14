import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom does not implement ResizeObserver, which Radix UI Popover depends on
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement scrollIntoView, which cmdk CommandItem uses
if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

afterEach(() => {
  cleanup();
});
