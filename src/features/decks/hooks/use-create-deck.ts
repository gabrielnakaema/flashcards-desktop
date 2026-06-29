import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decksQueryKeys } from "./decks-query-keys";
import { cardsQueryKeys } from "@/features/cards";

export const useCreateDeck = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: deckRepository.createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: cardsQueryKeys.all });
    },
  });

  return {
    create: mutate,
    isPending,
    isError,
    error,
  };
};
