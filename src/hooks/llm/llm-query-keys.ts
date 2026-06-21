import type { LlmProviderId } from "@/types/llm";

export const llmQueryKeys = {
  all: ["llm"] as const,
  models: (provider: LlmProviderId) =>
    [...llmQueryKeys.all, "models", provider] as const,
};
