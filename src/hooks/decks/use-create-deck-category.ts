import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckCategoriesQueryKeys } from "./decks-query-keys";

const repo = deckRepository;

export const useCreateDeckCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckCategoriesQueryKeys.all });
    },
  });

  return {
    create: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
