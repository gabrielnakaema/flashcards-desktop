import { describe, expect, it } from "vitest";
import type { Card } from "@/types/card";
import {
  DEFAULT_CARD_LIST_FILTERS,
  filterCards,
  hasActiveCardListFilters,
  isCardTypeFilter,
  isDifficultyFilter,
  normalizeCardListFilters,
} from "./card-list-filters";

const mockCards: Card[] = [
  {
    id: "card-1",
    deckId: "deck-1",
    front: "specific text from card 1",
    back: "specific text from card 1 back",
    hint: "specific text from card 1 hint",
    explanation: "specific text from card 1 explanation",
    sourceExcerpt: "specific text from card 1 source excerpt",
    difficulty: "easy",
    type: "multiple_choice",
    content: {
      choices: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Jupiter" },
      ],
      correctChoiceId: "a",
    },
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
    tags: ["vocab"],
    isSuspended: false,
  },
  {
    id: "card-2",
    deckId: "deck-1",
    front: "second front text",
    back: "second back text from card 2",
    hint: "second hint text from card 2",
    explanation: "second explanation text from card 2",
    sourceExcerpt: "second source excerpt text from card 2",
    difficulty: "medium",
    type: "multiple_choice",
    content: {
      choices: [
        { id: "c", text: "Mars" },
        { id: "d", text: "Venus" },
      ],
      correctChoiceId: "c",
    },
    tags: ["grammar"],
    isSuspended: false,
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    id: "card-3",
    deckId: "deck-1",
    front: "different text that shows up in third card front",
    back: "different text that shows up in third card back",
    hint: "different text that shows up in third card hint",
    explanation: "different text that shows up in third card explanation",
    sourceExcerpt: "different text that shows up in third card source excerpt",
    difficulty: "hard",
    type: "multiple_choice",
    content: {
      choices: [
        { id: "e", text: "Saturn" },
        { id: "f", text: "Uranus" },
      ],
      correctChoiceId: "e",
    },
    tags: [],
    isSuspended: false,
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    id: "card-4",
    deckId: "deck-1",
    type: "plain",
    front: "fourth front text",
    back: "fourth back text",
    hint: "fourth hint text",
    explanation: "fourth explanation text",
    sourceExcerpt: "fourth source excerpt text",
    difficulty: "easy",
    content: {},
    tags: ["chapter-1"],
    isSuspended: false,
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    id: "card-5",
    deckId: "deck-1",
    type: "typed_answer",
    front: "fifth front text",
    back: "fifth back text",
    hint: "fifth hint text",
    explanation: "fifth explanation text",
    sourceExcerpt: "fifth source excerpt text",
    difficulty: "easy",
    content: {
      acceptedAnswer: "SQLite",
      aliases: ["sqlite", "SQLite database"],
      caseSensitive: false,
    },
    tags: [],
    isSuspended: false,
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
];

const cardIds = (cards: Card[]) => cards.map((card) => card.id);

describe("normalizeCardListFilters", () => {
  it("returns default filters when none are provided", () => {
    expect(normalizeCardListFilters({})).toEqual(DEFAULT_CARD_LIST_FILTERS);
  });

  it("returns provided valid filters", () => {
    expect(
      normalizeCardListFilters({
        difficulty: "easy",
        type: "multiple_choice",
        search: "gravity",
      })
    ).toEqual({
      search: "gravity",
      type: "multiple_choice",
      difficulty: "easy",
    });
  });

  it("preserves search text including trailing spaces", () => {
    expect(normalizeCardListFilters({ search: "hello world " })).toEqual({
      ...DEFAULT_CARD_LIST_FILTERS,
      search: "hello world ",
    });
  });

  it("falls back to default type for invalid values", () => {
    expect(
      normalizeCardListFilters({ type: "invalid" as Card["type"] })
    ).toEqual(DEFAULT_CARD_LIST_FILTERS);
  });

  it("falls back to default difficulty for invalid values", () => {
    expect(
      normalizeCardListFilters({ difficulty: "impossible" as "easy" })
    ).toEqual(DEFAULT_CARD_LIST_FILTERS);
  });

  it("keeps valid partial filters and defaults the rest", () => {
    expect(normalizeCardListFilters({ type: "plain" })).toEqual({
      search: "",
      type: "plain",
      difficulty: "all",
    });
  });
});

describe("isCardTypeFilter", () => {
  it("accepts all supported card type filter values", () => {
    expect(isCardTypeFilter("all")).toBe(true);
    expect(isCardTypeFilter("plain")).toBe(true);
    expect(isCardTypeFilter("multiple_choice")).toBe(true);
    expect(isCardTypeFilter("typed_answer")).toBe(true);
  });

  it("rejects unsupported values", () => {
    expect(isCardTypeFilter("invalid")).toBe(false);
    expect(isCardTypeFilter(null)).toBe(false);
    expect(isCardTypeFilter(undefined)).toBe(false);
  });
});

describe("isDifficultyFilter", () => {
  it("accepts all supported difficulty filter values", () => {
    expect(isDifficultyFilter("all")).toBe(true);
    expect(isDifficultyFilter("easy")).toBe(true);
    expect(isDifficultyFilter("medium")).toBe(true);
    expect(isDifficultyFilter("hard")).toBe(true);
  });

  it("rejects unsupported values", () => {
    expect(isDifficultyFilter("impossible")).toBe(false);
    expect(isDifficultyFilter(42)).toBe(false);
  });
});

describe("hasActiveCardListFilters", () => {
  it("returns false for default filters", () => {
    expect(hasActiveCardListFilters(DEFAULT_CARD_LIST_FILTERS)).toBe(false);
  });

  it("returns true when search has non-whitespace content", () => {
    expect(
      hasActiveCardListFilters({ ...DEFAULT_CARD_LIST_FILTERS, search: "test" })
    ).toBe(true);
  });

  it("returns false when search is only whitespace", () => {
    expect(
      hasActiveCardListFilters({ ...DEFAULT_CARD_LIST_FILTERS, search: "   " })
    ).toBe(false);
  });

  it("returns true when type or difficulty differ from defaults", () => {
    expect(
      hasActiveCardListFilters({ ...DEFAULT_CARD_LIST_FILTERS, type: "plain" })
    ).toBe(true);
    expect(
      hasActiveCardListFilters({
        ...DEFAULT_CARD_LIST_FILTERS,
        difficulty: "hard",
      })
    ).toBe(true);
  });
});

describe("filterCards", () => {
  it("returns all cards when filters are default", () => {
    const filtered = filterCards(mockCards, DEFAULT_CARD_LIST_FILTERS);
    expect(cardIds(filtered)).toEqual(cardIds(mockCards));
  });

  it("filters by difficulty only", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ difficulty: "easy" })
    );

    expect(cardIds(filtered)).toEqual(["card-1", "card-4", "card-5"]);
  });

  it("filters by type only", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ type: "multiple_choice" })
    );

    expect(cardIds(filtered)).toEqual(["card-1", "card-2", "card-3"]);
  });

  it("filters by plain and typed_answer types", () => {
    expect(
      cardIds(
        filterCards(mockCards, normalizeCardListFilters({ type: "plain" }))
      )
    ).toEqual(["card-4"]);

    expect(
      cardIds(
        filterCards(
          mockCards,
          normalizeCardListFilters({ type: "typed_answer" })
        )
      )
    ).toEqual(["card-5"]);
  });

  it("filters by search text in front", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "second front" })
    );

    expect(cardIds(filtered)).toEqual(["card-2"]);
  });

  it("filters by search text in back", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "fourth back" })
    );

    expect(cardIds(filtered)).toEqual(["card-4"]);
  });

  it("filters by search text in hint", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "fifth hint" })
    );

    expect(cardIds(filtered)).toEqual(["card-5"]);
  });

  it("filters by search text in explanation", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "second explanation" })
    );

    expect(cardIds(filtered)).toEqual(["card-2"]);
  });

  it("filters by search text in source excerpt", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "third card source excerpt" })
    );

    expect(cardIds(filtered)).toEqual(["card-3"]);
  });

  it("filters by search text in tags", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "chapter-1" })
    );

    expect(cardIds(filtered)).toEqual(["card-4"]);
  });

  it("matches search case-insensitively", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "SPECIFIC TEXT" })
    );

    expect(cardIds(filtered)).toEqual(["card-1"]);
  });

  it("ignores leading and trailing whitespace in search", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "  second front  " })
    );

    expect(cardIds(filtered)).toEqual(["card-2"]);
  });

  it("returns all cards when search is only whitespace", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "   " })
    );

    expect(cardIds(filtered)).toEqual(cardIds(mockCards));
  });

  it("returns no cards when search matches nothing", () => {
    const filtered = filterCards(
      mockCards,
      normalizeCardListFilters({ search: "does-not-exist" })
    );

    expect(filtered).toEqual([]);
  });

  it("applies type, difficulty, and search filters together", () => {
    const filtered = filterCards(mockCards, {
      search: "specific",
      type: "multiple_choice",
      difficulty: "easy",
    });

    expect(cardIds(filtered)).toEqual(["card-1"]);
  });

  it("returns no cards when combined filters exclude everything", () => {
    const filtered = filterCards(mockCards, {
      search: "second front",
      type: "plain",
      difficulty: "all",
    });

    expect(filtered).toEqual([]);
  });

  it("returns an empty array when given no cards", () => {
    expect(filterCards([], DEFAULT_CARD_LIST_FILTERS)).toEqual([]);
  });
});
