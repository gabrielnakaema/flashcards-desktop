import type { Card } from "@/features/cards/types";

export type CardTypeFilter = Card["type"] | "all";
export type DifficultyFilter = NonNullable<Card["difficulty"]> | "all";

export interface CardListFilters {
  search: string;
  type: CardTypeFilter;
  difficulty: DifficultyFilter;
}

export const DEFAULT_CARD_LIST_FILTERS: CardListFilters = {
  search: "",
  type: "all",
  difficulty: "all",
};

export const CARD_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "plain", label: "Plain" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "typed_answer", label: "Typed answer" },
] as const satisfies readonly { value: CardTypeFilter; label: string }[];

export const DIFFICULTY_FILTER_OPTIONS = [
  { value: "all", label: "All difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const satisfies readonly { value: DifficultyFilter; label: string }[];

const CARD_TYPE_FILTER_VALUES = CARD_TYPE_FILTER_OPTIONS.map(
  (option) => option.value
);
const DIFFICULTY_FILTER_VALUES = DIFFICULTY_FILTER_OPTIONS.map(
  (option) => option.value
);

export const isCardTypeFilter = (value: unknown): value is CardTypeFilter => {
  return (
    typeof value === "string" &&
    CARD_TYPE_FILTER_VALUES.includes(value as CardTypeFilter)
  );
};

export const isDifficultyFilter = (
  value: unknown
): value is DifficultyFilter => {
  return (
    typeof value === "string" &&
    DIFFICULTY_FILTER_VALUES.includes(value as DifficultyFilter)
  );
};

export const normalizeCardListFilters = (
  filters: Partial<CardListFilters>
): CardListFilters => ({
  search: filters.search ?? DEFAULT_CARD_LIST_FILTERS.search,
  type: isCardTypeFilter(filters.type)
    ? filters.type
    : DEFAULT_CARD_LIST_FILTERS.type,
  difficulty: isDifficultyFilter(filters.difficulty)
    ? filters.difficulty
    : DEFAULT_CARD_LIST_FILTERS.difficulty,
});

export const filterCards = <T extends Card>(
  cards: T[],
  filters: CardListFilters
) => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return cards.filter((card) => {
    const matchesType = filters.type === "all" || card.type === filters.type;
    const matchesDifficulty =
      filters.difficulty === "all" || card.difficulty === filters.difficulty;
    const searchableText = [
      card.front,
      card.back,
      card.hint,
      card.explanation,
      card.sourceExcerpt,
      ...card.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      matchesType &&
      matchesDifficulty &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    );
  });
};

export const hasActiveCardListFilters = (filters: CardListFilters) => {
  return (
    Boolean(filters.search.trim()) ||
    filters.type !== DEFAULT_CARD_LIST_FILTERS.type ||
    filters.difficulty !== DEFAULT_CARD_LIST_FILTERS.difficulty
  );
};
