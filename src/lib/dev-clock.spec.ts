import {
  clearDevClock,
  getDevClockTime,
  initializeDevClock,
  setDevClockTime,
} from "./dev-clock";
import { afterEach, describe, expect, it } from "vitest";

const NativeDate = Date;

afterEach(() => {
  clearDevClock();
  localStorage.removeItem("flashcards:dev-clock-now");
});

describe("dev clock", () => {
  it("uses native time when no override is active", () => {
    expect(getDevClockTime()).toBeNull();
    expect(Date).toBe(NativeDate);
  });

  it("overrides new Date and Date.now when a custom time is set", () => {
    const timeMs = setDevClockTime("2026-06-18T12:00:00.000Z");

    expect(getDevClockTime()).toBe(timeMs);
    expect(Date.now()).toBe(timeMs);
    expect(new Date().toISOString()).toBe("2026-06-18T12:00:00.000Z");
  });

  it("preserves explicit Date constructor values", () => {
    setDevClockTime("2026-06-18T12:00:00.000Z");

    expect(new Date("2026-01-01T00:00:00.000Z").toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
  });

  it("restores native time when cleared", () => {
    setDevClockTime("2026-06-18T12:00:00.000Z");

    clearDevClock();

    expect(getDevClockTime()).toBeNull();
    expect(Date).toBe(NativeDate);
  });

  it("initializes from persisted localStorage time", () => {
    localStorage.setItem(
      "flashcards:dev-clock-now",
      "2026-06-18T12:00:00.000Z"
    );

    initializeDevClock();

    expect(new Date().toISOString()).toBe("2026-06-18T12:00:00.000Z");
  });
});
