import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckCategoriesQueryKeys } from "../../hooks/decks-query-keys";

const repo = deckRepository;

export const useDeleteDeckCategory = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckCategoriesQueryKeys.all });
      onSuccess?.();
    },
  });

  return {
    remove: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
