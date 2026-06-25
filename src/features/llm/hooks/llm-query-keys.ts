import type { LlmProviderId } from "@/features/llm/types";

export const llmQueryKeys = {
  all: ["llm"] as const,
  models: (provider: LlmProviderId) =>
    [...llmQueryKeys.all, "models", provider] as const,
};
