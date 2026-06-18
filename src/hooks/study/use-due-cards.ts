import { cardRepository } from "@/data/repositories";
import { cardsQueryKeys } from "@/hooks/cards/cards-query-keys";
import { useQuery } from "@tanstack/react-query";

export const useDueCards = (deckId: string) => {
  return useQuery({
    queryKey: cardsQueryKeys.dueByDeck(deckId),
    queryFn: () => cardRepository.getDueCards(deckId),
  });
};
