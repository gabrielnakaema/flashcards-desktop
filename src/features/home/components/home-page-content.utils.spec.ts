import { describe, expect, it } from "vitest";
import {
  formatNextDueAt,
  formatWelcomeDate,
  getCurrentTimeOfDay,
  getPageState,
} from "./home-page-content.utils";

describe("getPageState", () => {
  it("returns 'no-decks' when deckCount is 0", () => {
    expect(
      getPageState({ deckCount: 0, totalCardsInDecks: 0, cardsDueNow: 0 })
    ).toBe("no-decks");
  });

  it("returns 'no-cards' when decks exist but no cards", () => {
    expect(
      getPageState({ deckCount: 1, totalCardsInDecks: 0, cardsDueNow: 0 })
    ).toBe("no-cards");
  });

  it("returns 'has-due-cards' when there are cards due", () => {
    expect(
      getPageState({ deckCount: 1, totalCardsInDecks: 10, cardsDueNow: 3 })
    ).toBe("has-due-cards");
  });

  it("returns 'caught-up' when cards exist but none are due", () => {
    expect(
      getPageState({ deckCount: 1, totalCardsInDecks: 10, cardsDueNow: 0 })
    ).toBe("caught-up");
  });

  it("returns 'caught-up' when data is undefined", () => {
    expect(getPageState(undefined)).toBe("caught-up");
  });

  it("'no-decks' takes precedence over 'no-cards'", () => {
    expect(
      getPageState({ deckCount: 0, totalCardsInDecks: 0, cardsDueNow: 0 })
    ).toBe("no-decks");
  });
});

describe("formatNextDueAt", () => {
  it("returns empty string for null", () => {
    expect(formatNextDueAt(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatNextDueAt(undefined)).toBe("");
  });

  it("returns a non-empty string for a valid ISO date", () => {
    const result = formatNextDueAt("2024-06-15T14:30:00.000Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});

describe("getCurrentTimeOfDay", () => {
  it("returns 'morning' before noon", () => {
    expect(getCurrentTimeOfDay(new Date("2024-06-15T08:00:00"))).toBe(
      "morning"
    );
  });

  it("returns 'afternoon' between noon and 18:00", () => {
    expect(getCurrentTimeOfDay(new Date("2024-06-15T14:00:00"))).toBe(
      "afternoon"
    );
  });

  it("returns 'evening' at 18:00 and later", () => {
    expect(getCurrentTimeOfDay(new Date("2024-06-15T20:00:00"))).toBe(
      "evening"
    );
  });

  it("returns 'morning' at exactly midnight", () => {
    expect(getCurrentTimeOfDay(new Date("2024-06-15T00:00:00"))).toBe(
      "morning"
    );
  });

  it("returns 'afternoon' at exactly noon", () => {
    expect(getCurrentTimeOfDay(new Date("2024-06-15T12:00:00"))).toBe(
      "afternoon"
    );
  });
});

describe("formatWelcomeDate", () => {
  it("returns a non-empty string", () => {
    const result = formatWelcomeDate(new Date("2024-06-15T12:00:00"));
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("does not contain a comma", () => {
    const result = formatWelcomeDate(new Date("2024-06-15T12:00:00"));
    expect(result).not.toContain(",");
  });

  it("includes the day of the week abbreviation", () => {
    const result = formatWelcomeDate(new Date("2024-06-15T12:00:00"));
    expect(result).toContain("Sat");
  });

  it("includes the month abbreviation", () => {
    const result = formatWelcomeDate(new Date("2024-06-15T12:00:00"));
    expect(result).toContain("Jun");
  });
});
