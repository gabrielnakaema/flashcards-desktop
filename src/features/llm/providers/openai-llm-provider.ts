import {
  generatedCardSchema,
  generatedCardsResponseSchema,
  type GeneratedCard,
  type LlmModelOption,
} from "@/features/llm/types";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { flashcardResponseJsonSchema } from "./flashcard-response-json-schema";
import type { LlmProvider } from "./llm-provider";

// const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_DEFAULT_MODEL = "gpt-4.1-mini";
const OPENAI_MODEL_OPTIONS: LlmModelOption[] = [
  { label: "gpt-5.5", value: "gpt-5.5" },
  { label: "gpt-5.5-pro", value: "gpt-5.5-pro" },
  { label: "gpt-5.4", value: "gpt-5.4" },
  { label: "gpt-5.4-mini", value: "gpt-5.4-mini" },
  { label: "gpt-5.4-nano", value: "gpt-5.4-nano" },
  { label: "gpt-5.4-pro", value: "gpt-5.4-pro" },
  { label: "gpt-4.1", value: "gpt-4.1" },
  { label: "gpt-4.1-mini", value: "gpt-4.1-mini" },
  { label: "gpt-4.1-nano", value: "gpt-4.1-nano" },
  { label: "gpt-4o", value: "gpt-4o" },
];

const openAiCardResponseFormat = {
  type: "json_schema",
  name: "flashcard_generation",
  strict: true,
  schema: flashcardResponseJsonSchema,
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/* const toLlmModelOption = (value: unknown): LlmModelOption | null => {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    label: value.id,
    value: value.id,
  };
};

const parseOpenAiModels = (payload: unknown): LlmModelOption[] => {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error("OpenAI returned an invalid model list.");
  }

  return payload.data
    .map(toLlmModelOption)
    .filter((model): model is LlmModelOption => model !== null)
    .sort((first, second) => first.label.localeCompare(second.label));
}; */

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("OpenAI returned a response that was not valid JSON.");
  }
};

const getOpenAiStreamError = (event: Record<string, unknown>): string | null => {
  if (isRecord(event.error) && typeof event.error.message === "string") {
    return event.error.message;
  }

  if (
    isRecord(event.response) &&
    isRecord(event.response.error) &&
    typeof event.response.error.message === "string"
  ) {
    return event.response.error.message;
  }

  if (typeof event.message === "string") {
    return event.message;
  }

  return null;
};

const extractCompleteCardJson = (text: string): string[] => {
  const cardsPropertyMatch = /"cards"\s*:/.exec(text);

  if (!cardsPropertyMatch) {
    return [];
  }

  const arrayStart = text.indexOf(
    "[",
    cardsPropertyMatch.index + cardsPropertyMatch[0].length
  );

  if (arrayStart === -1) {
    return [];
  }

  const cards: string[] = [];
  let objectStart = -1;
  let objectDepth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = arrayStart + 1; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "]" && objectDepth === 0) {
      break;
    }

    if (character === "{") {
      if (objectDepth === 0) {
        objectStart = index;
      }

      objectDepth += 1;
      continue;
    }

    if (character === "}" && objectDepth > 0) {
      objectDepth -= 1;

      if (objectDepth === 0 && objectStart !== -1) {
        cards.push(text.slice(objectStart, index + 1));
        objectStart = -1;
      }
    }
  }

  return cards;
};

const emitNewCards = (
  outputText: string,
  emittedCardCount: number,
  onCardGenerated?: (card: GeneratedCard) => void
): number => {
  if (!onCardGenerated) {
    return emittedCardCount;
  }

  const completeCards = extractCompleteCardJson(outputText);

  for (const cardJson of completeCards.slice(emittedCardCount)) {
    const result = generatedCardSchema.safeParse(parseJson(cardJson));

    if (!result.success) {
      throw new Error("OpenAI returned invalid flashcard data.");
    }

    onCardGenerated(result.data);
    emittedCardCount += 1;
  }

  return emittedCardCount;
};

const parseSseEvent = (frame: string): Record<string, unknown> | null => {
  const dataLine = frame
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"));

  if (!dataLine) {
    return null;
  }

  const data = dataLine.slice(5).trimStart();

  if (!data || data === "[DONE]") {
    return null;
  }

  const event = parseJson(data);

  if (!isRecord(event)) {
    throw new Error("OpenAI returned an invalid streaming event.");
  }

  return event;
};

const streamOpenAiCards = async (
  response: Response,
  onCardGenerated?: (card: GeneratedCard) => void
): Promise<GeneratedCard[]> => {
  if (!response.body) {
    throw new Error("OpenAI response did not include a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let streamBuffer = "";
  let outputText = "";
  let emittedCardCount = 0;
  let streamFinished = false;

  const handleFrame = (frame: string) => {
    const event = parseSseEvent(frame);

    if (!event || typeof event.type !== "string") {
      return;
    }

    if (
      event.type === "error" ||
      event.type === "response.failed" ||
      event.type === "response.incomplete"
    ) {
      throw new Error(
        getOpenAiStreamError(event) ?? "OpenAI failed to generate flashcards."
      );
    }

    if (
      event.type === "response.output_text.delta" &&
      typeof event.delta === "string"
    ) {
      outputText += event.delta;
      emittedCardCount = emitNewCards(
        outputText,
        emittedCardCount,
        onCardGenerated
      );
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      streamBuffer += decoder.decode(value, { stream: !done });

      const frames = streamBuffer.split(/\r?\n\r?\n/);
      streamBuffer = frames.pop() ?? "";
      for (const frame of frames) {
        handleFrame(frame);
      }

      if (done) {
        streamFinished = true;
        break;
      }
    }

    if (streamBuffer.trim()) {
      handleFrame(streamBuffer);
    }

    const result = generatedCardsResponseSchema.safeParse(parseJson(outputText));

    if (!result.success) {
      throw new Error("OpenAI returned invalid flashcard data.");
    }

    return result.data.cards;
  } finally {
    if (!streamFinished) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
};

const readOpenAiError = async (response: Response): Promise<string> => {
  const fallback = `OpenAI request failed with status ${response.status}.`;
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text) as unknown;

    if (!isRecord(payload) || !isRecord(payload.error)) {
      return fallback;
    }

    if (typeof payload.error.message !== "string") {
      return fallback;
    }

    return payload.error.message;
  } catch {
    return fallback;
  }
};

const buildOpenAiRequestBody = (
  model: string,
  systemPrompt: string,
  prompt: string
): Record<string, unknown> => {
  return {
    model,
    stream: true,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
    text: {
      format: openAiCardResponseFormat,
    },
  };
};

export const openAiLlmProvider: LlmProvider = {
  id: "openai",
  label: "OpenAI",
  defaultModel: OPENAI_DEFAULT_MODEL,
  listModels: async ({ apiKey }) => {
    void apiKey;

    /* const response = await tauriFetch(OPENAI_MODELS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(await readOpenAiError(response));
    }
    
    const payload = (await response.json()) as unknown;
    return parseOpenAiModels(payload); */

    return OPENAI_MODEL_OPTIONS;
  },
  generateCards: async ({
    apiKey,
    model,
    systemPrompt,
    prompt,
    onCardGenerated,
  }) => {
    const body = buildOpenAiRequestBody(model, systemPrompt, prompt);

    const response = await tauriFetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await readOpenAiError(response));
    }

    return streamOpenAiCards(response, onCardGenerated);
  },
};
