import { useQuery } from "@tanstack/react-query";
import { decksQueryKeys } from "./decks-query-keys";
import { deckRepository } from "@/data/repositories";

export const useDeckDetails = (deckId: string) => {
  return useQuery({
    queryKey: decksQueryKeys.details(deckId),
    queryFn: () => deckRepository.getDeck(deckId),
  });
};
