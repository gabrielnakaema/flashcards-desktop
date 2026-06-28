import { studyRepository } from "@/data/repositories";
import { cardsQueryKeys } from "@/features/cards";
import { decksQueryKeys } from "@/features/decks";
import type { SubmitReviewPayload } from "@/features/cards";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSubmitReview = (deckId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: SubmitReviewPayload) =>
      studyRepository.submitReview(payload),
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
