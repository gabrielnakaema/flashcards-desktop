import { getLlmProvider } from "@/features/llm";
import type { GenerateCardsRequest } from "@/features/llm";
import type { GeneratedCard } from "@/features/llm";
import type { LlmProviderId } from "@/features/llm";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export interface GenerateCardsMutationRequest extends GenerateCardsRequest {
  provider: LlmProviderId;
}

export const useGenerateCards = () => {
  const [streamedCards, setStreamedCards] = useState<GeneratedCard[]>([]);

  const mutation = useMutation({
    mutationFn: ({
      provider,
      onCardGenerated,
      ...request
    }: GenerateCardsMutationRequest) =>
      getLlmProvider(provider).generateCards({
        ...request,
        onCardGenerated: (card) => {
          setStreamedCards((current) => [...current, card]);
          onCardGenerated?.(card);
        },
      }),
    onMutate: () => {
      setStreamedCards([]);
    },
  });

  return {
    ...mutation,
    data: mutation.data ?? streamedCards,
    reset: () => {
      setStreamedCards([]);
      mutation.reset();
    },
  };
};
