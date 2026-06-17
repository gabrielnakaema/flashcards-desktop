export const cardsQueryKeys = {
  all: ["cards"] as const,
  listByDeck: (deckId: string) =>
    [...cardsQueryKeys.all, "list", deckId] as const,
};
