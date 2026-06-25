import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decksQueryKeys } from "./decks-query-keys";

const repo = deckRepository;

interface UseDeleteDeckProps {
  onSuccess?: () => void;
}

export const useDeleteDeck = ({ onSuccess }: UseDeleteDeckProps = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.deleteDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
      onSuccess?.();
    },
  });

  return {
    remove: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
