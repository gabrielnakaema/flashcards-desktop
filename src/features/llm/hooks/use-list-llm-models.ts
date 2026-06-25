import { getLlmProvider } from "@/features/llm/providers/llm-provider";
import type { LlmProviderId } from "@/features/llm/types";
import { useQuery } from "@tanstack/react-query";
import { llmQueryKeys } from "./llm-query-keys";

interface UseListLlmModelsOptions {
  provider: LlmProviderId;
  apiKey: string;
  enabled?: boolean;
}

export const useListLlmModels = ({
  provider,
  apiKey,
  enabled = false,
}: UseListLlmModelsOptions) => {
  return useQuery({
    queryKey: llmQueryKeys.models(provider),
    queryFn: () => getLlmProvider(provider).listModels({ apiKey }),
    enabled,
    gcTime: Infinity,
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};
