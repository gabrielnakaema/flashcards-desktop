import { getLlmProvider } from "@/features/llm";
import type { GenerateCardsRequest } from "@/features/llm";
import type { LlmProviderId } from "@/features/llm";
import { useMutation } from "@tanstack/react-query";

export interface GenerateCardsMutationRequest extends GenerateCardsRequest {
  provider: LlmProviderId;
}

export const useGenerateCards = () => {
  const mutation = useMutation({
    mutationFn: ({ provider, ...request }: GenerateCardsMutationRequest) =>
      getLlmProvider(provider).generateCards(request),
  });

  return mutation;
};
