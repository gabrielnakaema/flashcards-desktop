import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decksQueryKeys } from "./decks-query-keys";

const repo = deckRepository;

export const useUpdateDeck = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.updateDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
    },
  });

  return {
    update: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
