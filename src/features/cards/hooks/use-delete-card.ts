import { cardRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";

interface UseDeleteCardProps {
  onSuccess?: () => void;
}

export const useDeleteCard = ({ onSuccess }: UseDeleteCardProps = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: cardRepository.deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardsQueryKeys.all });
      onSuccess?.();
    },
  });

  return {
    delete: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
