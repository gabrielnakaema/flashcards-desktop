import { studyRepository } from "@/data/repositories";
import { invalidateCardQueries } from "@/features/cards/hooks/invalidate-card-queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseBuryCardProps {
  onSuccess?: () => void;
}

export const useBuryCard = ({ onSuccess }: UseBuryCardProps = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ cardId, dueAt }: { cardId: string; dueAt: string }) =>
      studyRepository.buryCard(cardId, dueAt),
    onSuccess: () => {
      toast.success("Card buried until tomorrow");
      void invalidateCardQueries(queryClient);
      onSuccess?.();
    },
  });

  return {
    bury: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
