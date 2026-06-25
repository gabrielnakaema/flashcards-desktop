import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deckCategoriesQueryKeys,
  decksQueryKeys,
} from "../../hooks/decks-query-keys";

const repo = deckRepository;

export const useUpdateDeckCategory = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckCategoriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
      onSuccess?.();
    },
  });

  return {
    update: mutation.mutate,
    asyncUpdate: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
