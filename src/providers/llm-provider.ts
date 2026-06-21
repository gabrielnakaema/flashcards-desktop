import type { GeneratedCard, LlmProviderId } from "@/types/llm";
import { openAiLlmProvider } from "./openai-llm-provider";

export interface GenerateCardsRequest {
  apiKey: string;
  systemPrompt: string;
  prompt: string;
}

export interface LlmProvider {
  id: LlmProviderId;
  generateCards: (request: GenerateCardsRequest) => Promise<GeneratedCard[]>;
}

export const getLlmProvider = (provider: LlmProviderId): LlmProvider => {
  if (provider === "openai") {
    return openAiLlmProvider;
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
};
