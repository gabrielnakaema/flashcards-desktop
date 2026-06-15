export const decksQueryKeys = {
  all: ["decks"] as const,
  list: () => [...decksQueryKeys.all, "list"] as const,
};

export const deckCategoriesQueryKeys = {
  all: ["deck-categories"] as const,
  list: () => [...deckCategoriesQueryKeys.all, "list"] as const,
};
