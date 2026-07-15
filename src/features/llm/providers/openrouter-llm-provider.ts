import {
  generatedCardsResponseSchema,
  type LlmModelOption,
} from "@/features/llm/types";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { flashcardResponseJsonSchema } from "./flashcard-response-json-schema";
import type { LlmProvider } from "./llm-provider";

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_FREE_MODEL = "openrouter/free";
const OPENROUTER_MODEL_OPTIONS: LlmModelOption[] = [
  { label: OPENROUTER_FREE_MODEL, value: OPENROUTER_FREE_MODEL },
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const describeError = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unknown network error.";
};

const parseEnvelope = (text: string): Record<string, unknown> => {
  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      "OpenRouter returned a response envelope that was not valid JSON."
    );
  }

  if (!isRecord(payload)) {
    throw new Error("OpenRouter returned an invalid response envelope.");
  }

  return payload;
};

const readOpenRouterError = async (response: Response): Promise<string> => {
  const fallback = `OpenRouter request failed with status ${response.status}.`;
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text) as unknown;

    if (
      isRecord(payload) &&
      isRecord(payload.error) &&
      typeof payload.error.message === "string" &&
      payload.error.message.trim()
    ) {
      return payload.error.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
};

const extractContent = (payload: Record<string, unknown>): string => {
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;

  if (
    !isRecord(choice) ||
    !isRecord(choice.message) ||
    typeof choice.message.content !== "string" ||
    !choice.message.content.trim()
  ) {
    throw new Error("OpenRouter returned an invalid response envelope.");
  }

  return choice.message.content;
};

const parseGeneratedCards = (content: string) => {
  let payload: unknown;

  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error(
      "OpenRouter returned flashcard content that was not valid JSON."
    );
  }

  const result = generatedCardsResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new Error("OpenRouter returned invalid flashcard data.");
  }

  return result.data.cards;
};

const buildOpenRouterRequestBody = (
  systemPrompt: string,
  prompt: string
): Record<string, unknown> => ({
  model: OPENROUTER_FREE_MODEL,
  stream: false,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "flashcard_generation",
      strict: true,
      schema: flashcardResponseJsonSchema,
    },
  },
  provider: {
    require_parameters: true,
  },
});

export const openRouterLlmProvider: LlmProvider = {
  id: "openrouter",
  label: "OpenRouter",
  defaultModel: OPENROUTER_FREE_MODEL,
  listModels: async ({ apiKey }) => {
    void apiKey;
    return OPENROUTER_MODEL_OPTIONS;
  },
  generateCards: async ({
    apiKey,
    model,
    systemPrompt,
    prompt,
    onCardGenerated,
  }) => {
    void model;

    let response: Response;

    try {
      response = await tauriFetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildOpenRouterRequestBody(systemPrompt, prompt)),
      });
    } catch (error) {
      throw new Error(
        `OpenRouter network request failed: ${describeError(error)}`
      );
    }

    if (!response.ok) {
      throw new Error(await readOpenRouterError(response));
    }

    const cards = parseGeneratedCards(
      extractContent(parseEnvelope(await response.text()))
    );

    cards.forEach((card) => onCardGenerated?.(card));
    return cards;
  },
};
