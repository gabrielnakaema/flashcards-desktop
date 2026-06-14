import { deckRepository } from "@/data/repositories";
import { decksQueryKeys } from "./decks-query-keys";
import { useQuery } from "@tanstack/react-query";

const repo = deckRepository;

export const useListDecks = () => {
  return useQuery({
    queryKey: decksQueryKeys.list(),
    queryFn: () => repo.listDeckWithStats(),
  });
};
