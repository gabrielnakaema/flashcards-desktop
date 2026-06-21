import { getLlmProvider } from "@/providers/llm-provider";
import type { GenerateCardsRequest } from "@/providers/llm-provider";
import type { LlmProviderId } from "@/types/llm";
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
