import { cardRepository } from "@/data/repositories";
import { decksQueryKeys } from "@/features/decks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";

export const useBulkCreateCards = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: cardRepository.bulkCreateCards,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cardsQueryKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
    },
  });

  return {
    bulkCreate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
