import { deckRepository } from "@/data/repositories";
import type { UpdateDeckCategoryPayload } from "@/features/decks/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deckCategoriesQueryKeys,
  decksQueryKeys,
} from "../../hooks/decks-query-keys";
import { deckCategorySchema } from "../schemas/deck-category-schema";

export const useUpdateDeckCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: UpdateDeckCategoryPayload) => {
      const values = deckCategorySchema.parse(payload);
      return deckRepository.updateCategory({ id: payload.id, ...values });
    },
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
    update: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
