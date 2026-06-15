import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckCategoriesQueryKeys } from "./decks-query-keys";

const repo = deckRepository;

export const useDeleteDeckCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckCategoriesQueryKeys.all });
    },
  });

  return {
    remove: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
