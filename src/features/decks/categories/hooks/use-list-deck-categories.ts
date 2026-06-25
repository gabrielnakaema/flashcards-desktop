import { deckRepository } from "@/data/repositories";
import { deckCategoriesQueryKeys } from "../../hooks/decks-query-keys";
import { useQuery } from "@tanstack/react-query";

const repo = deckRepository;

export const useListDeckCategories = () => {
  return useQuery({
    queryKey: deckCategoriesQueryKeys.list(),
    queryFn: () => repo.listCategories(),
  });
};
