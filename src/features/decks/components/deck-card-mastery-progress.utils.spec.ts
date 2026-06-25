import { describe, expect, it } from "vitest";
import {
  differenceInDays,
  formatLastReviewedAt,
  formatPercentage,
} from "./deck-card-mastery-progress.utils";

describe("formatPercentage", () => {
  it("formats 0 as 0%", () => {
    expect(formatPercentage(0)).toBe("0%");
  });

  it("formats 100 as 100%", () => {
    expect(formatPercentage(100)).toBe("100%");
  });

  it("formats 50 as 50%", () => {
    expect(formatPercentage(50)).toBe("50%");
  });

  it("formats fractional values with up to 1 decimal", () => {
    expect(formatPercentage(33.3)).toBe("33.3%");
  });

  it("rounds when more than 1 decimal place", () => {
    expect(formatPercentage(33.33)).toBe("33.3%");
  });
});

describe("differenceInDays", () => {
  it("returns 0 for the same instant", () => {
    const d = new Date("2024-06-15T12:00:00Z");
    expect(differenceInDays(d, d)).toBe(0);
  });

  it("returns 1 for dates exactly 1 day apart", () => {
    const now = new Date("2024-06-15T12:00:00Z");
    const yesterday = new Date("2024-06-14T12:00:00Z");
    expect(differenceInDays(now, yesterday)).toBe(1);
  });

  it("returns 7 for dates a week apart", () => {
    const now = new Date("2024-06-15T00:00:00Z");
    const weekAgo = new Date("2024-06-08T00:00:00Z");
    expect(differenceInDays(now, weekAgo)).toBe(7);
  });

  it("is symmetric — order of arguments does not affect result", () => {
    const a = new Date("2024-06-10T00:00:00Z");
    const b = new Date("2024-06-15T00:00:00Z");
    expect(differenceInDays(a, b)).toBe(differenceInDays(b, a));
  });
});

describe("formatLastReviewedAt", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("returns null when lastReviewedAt is null", () => {
    expect(formatLastReviewedAt(null, now)).toBeNull();
  });

  it("returns 'Today' when reviewed less than 1 day ago", () => {
    const sixHoursAgo = new Date("2024-06-15T06:00:00Z");
    expect(formatLastReviewedAt(sixHoursAgo.toISOString(), now)).toBe("Today");
  });

  it("returns 'Today' when reviewed exactly 1 day ago (within day boundary)", () => {
    const oneDayAgo = new Date("2024-06-14T12:00:00Z");
    expect(formatLastReviewedAt(oneDayAgo.toISOString(), now)).toBe("Today");
  });

  it("returns 'Yesterday' when reviewed ~2 days ago", () => {
    const twoDaysAgo = new Date("2024-06-13T12:00:00Z");
    expect(formatLastReviewedAt(twoDaysAgo.toISOString(), now)).toBe(
      "Yesterday"
    );
  });

  it("returns 'X days ago' when reviewed 3+ days ago", () => {
    const fiveDaysAgo = new Date("2024-06-10T12:00:00Z");
    expect(formatLastReviewedAt(fiveDaysAgo.toISOString(), now)).toBe(
      "5 days ago"
    );
  });

  it("uses the current time when now is not provided", () => {
    expect(() => formatLastReviewedAt("2020-01-01T00:00:00Z")).not.toThrow();
  });
});
