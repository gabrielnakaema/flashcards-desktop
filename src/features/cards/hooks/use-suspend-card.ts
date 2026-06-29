import { cardRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateCardQueries } from "./invalidate-card-queries";

interface UseSuspendCardProps {
  onSuccess?: () => void;
}

export const useSuspendCard = ({ onSuccess }: UseSuspendCardProps = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: cardRepository.suspendCard,
    onSuccess: () => {
      toast.success("Card suspended");
      void invalidateCardQueries(queryClient);
      onSuccess?.();
    },
  });

  return {
    suspend: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
