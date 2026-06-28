import { studyRepository } from "@/data/repositories";
import { cardsQueryKeys } from "@/features/cards";
import { useQuery } from "@tanstack/react-query";

export const useDueCards = (deckId: string) => {
  return useQuery({
    queryKey: cardsQueryKeys.dueByDeck(deckId),
    queryFn: () => studyRepository.getDueCards(deckId),
  });
};
