import { cardRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";
import { decksQueryKeys } from "@/hooks/decks/decks-query-keys";

export const useCreateCard = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: cardRepository.createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cardsQueryKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
    },
  });

  return {
    create: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
