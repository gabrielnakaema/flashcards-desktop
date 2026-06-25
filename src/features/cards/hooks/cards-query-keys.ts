export const cardsQueryKeys = {
  all: ["cards"] as const,
  listByDeck: (deckId: string) =>
    [...cardsQueryKeys.all, "list", deckId] as const,
  dueByDeck: (deckId: string) =>
    [...cardsQueryKeys.all, "due", deckId] as const,
  stats: () => [...cardsQueryKeys.all, "stats"] as const,
};
