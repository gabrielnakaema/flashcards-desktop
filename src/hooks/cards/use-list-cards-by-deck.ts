import { useQuery } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";
import { cardRepository } from "@/data/repositories";

export const useListCardsByDeck = (deckId: string) => {
  return useQuery({
    queryKey: cardsQueryKeys.listByDeck(deckId),
    queryFn: () => cardRepository.listCardsByDeck(deckId),
  });
};
