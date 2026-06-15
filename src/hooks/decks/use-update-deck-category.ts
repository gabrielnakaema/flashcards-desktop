import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckCategoriesQueryKeys } from "./decks-query-keys";

const repo = deckRepository;

export const useUpdateDeckCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckCategoriesQueryKeys.all });
    },
  });

  return {
    update: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
