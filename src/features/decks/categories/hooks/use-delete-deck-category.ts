import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deckCategoriesQueryKeys,
  decksQueryKeys,
} from "../../hooks/decks-query-keys";

export const useDeleteDeckCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deckRepository.deleteCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: deckCategoriesQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: decksQueryKeys.all }),
      ]);
    },
  });

  return {
    remove: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
