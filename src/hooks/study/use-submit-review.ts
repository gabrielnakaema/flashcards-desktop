import { cardRepository } from "@/data/repositories";
import { cardsQueryKeys } from "@/hooks/cards/cards-query-keys";
import { decksQueryKeys } from "@/hooks/decks/decks-query-keys";
import type { SubmitReviewPayload } from "@/types/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSubmitReview = (deckId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      cardRepository.submitReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cardsQueryKeys.dueByDeck(deckId),
      });
      queryClient.invalidateQueries({
        queryKey: cardsQueryKeys.listByDeck(deckId),
      });
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
    },
  });

  return {
    submitReview: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
