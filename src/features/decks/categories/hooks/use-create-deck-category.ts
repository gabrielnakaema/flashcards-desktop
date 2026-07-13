import { deckRepository } from "@/data/repositories";
import type { CreateDeckCategoryPayload } from "@/features/decks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckCategoriesQueryKeys } from "../../hooks/decks-query-keys";
import { deckCategorySchema } from "../schemas/deck-category-schema";

const repo = deckRepository;

export const useCreateDeckCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateDeckCategoryPayload) =>
      repo.createCategory(deckCategorySchema.parse(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deckCategoriesQueryKeys.all });
    },
  });

  return {
    create: mutation.mutate,
    asyncCreate: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};
