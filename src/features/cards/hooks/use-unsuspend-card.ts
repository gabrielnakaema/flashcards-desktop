import { cardRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateCardQueries } from "./invalidate-card-queries";

interface UseUnsuspendCardProps {
  onSuccess?: () => void;
}

export const useUnsuspendCard = ({ onSuccess }: UseUnsuspendCardProps = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: cardRepository.unsuspendCard,
    onSuccess: () => {
      void invalidateCardQueries(queryClient);
      onSuccess?.();
    },
  });

  return {
    unsuspend: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
