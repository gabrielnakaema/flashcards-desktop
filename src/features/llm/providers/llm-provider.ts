import type { GeneratedCard, LlmModelOption, LlmProviderId } from "@/features/llm/types";
import { openAiLlmProvider } from "./openai-llm-provider";

export interface GenerateCardsRequest {
  apiKey: string;
  model: string;
  systemPrompt: string;
  prompt: string;
  onCardGenerated?: (card: GeneratedCard) => void;
}

export interface ListLlmModelsRequest {
  apiKey: string;
}

export interface LlmProvider {
  id: LlmProviderId;
  label: string;
  defaultModel: string;
  listModels: (request: ListLlmModelsRequest) => Promise<LlmModelOption[]>;
  generateCards: (request: GenerateCardsRequest) => Promise<GeneratedCard[]>;
}

const llmProviders = [openAiLlmProvider] satisfies LlmProvider[];

export const defaultLlmProvider = openAiLlmProvider;

export const getLlmProviderOptions = () =>
  llmProviders.map((provider) => ({
    label: provider.label,
    value: provider.id,
  }));

export const getLlmProvider = (provider: LlmProviderId): LlmProvider => {
  const llmProvider = llmProviders.find((candidate) => candidate.id === provider);

  if (llmProvider) {
    return llmProvider;
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
};
