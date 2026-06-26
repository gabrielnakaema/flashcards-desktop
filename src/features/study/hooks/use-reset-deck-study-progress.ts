import { cardRepository } from "@/data/repositories";
import { cardsQueryKeys } from "@/features/cards";
import { decksQueryKeys } from "@/features/decks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useResetDeckStudyProgress = (deckId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cardRepository.resetDeckStudyProgress(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cardsQueryKeys.dueByDeck(deckId),
      });
      queryClient.invalidateQueries({
        queryKey: cardsQueryKeys.listByDeck(deckId),
      });
      queryClient.invalidateQueries({
        queryKey: decksQueryKeys.details(deckId),
      });
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.list() });
    },
  });

  return {
    resetDeckStudyProgress: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

