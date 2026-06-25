import { generatedCardsResponseSchema, type LlmModelOption } from "@/features/llm/types";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
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

const cardContentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "question",
    "choices",
    "correctChoiceId",
    "prompt",
    "acceptedAnswer",
    "aliases",
    "caseSensitive",
  ],
  properties: {
    question: { type: ["string", "null"] },
    choices: {
      anyOf: [
        {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "text"],
            properties: {
              id: { type: "string" },
              text: { type: "string" },
            },
          },
        },
        { type: "null" },
      ],
    },
    correctChoiceId: { type: ["string", "null"] },
    prompt: { type: ["string", "null"] },
    acceptedAnswer: { type: ["string", "null"] },
    aliases: {
      anyOf: [
        {
          type: "array",
          items: { type: "string" },
        },
        { type: "null" },
      ],
    },
    caseSensitive: { type: ["boolean", "null"] },
  },
} as const;

const openAiCardResponseFormat = {
  type: "json_schema",
  name: "flashcard_generation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["cards"],
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "front",
            "back",
            "content",
            "hint",
            "explanation",
            "sourceExcerpt",
            "difficulty",
            "tags",
          ],
          properties: {
            type: {
              type: "string",
              enum: ["plain", "multiple_choice", "typed_answer"],
            },
            front: { type: "string" },
            back: { type: ["string", "null"] },
            content: cardContentJsonSchema,
            hint: { type: ["string", "null"] },
            explanation: { type: ["string", "null"] },
            sourceExcerpt: { type: ["string", "null"] },
            difficulty: {
              anyOf: [
                { type: "string", enum: ["easy", "medium", "hard"] },
                { type: "null" },
              ],
            },
            tags: {
              anyOf: [
                {
                  type: "array",
                  items: { type: "string" },
                },
                { type: "null" },
              ],
            },
          },
        },
      },
    },
  },
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

const getRecordArray = (
  value: Record<string, unknown>,
  key: string
): Record<string, unknown>[] => {
  const candidate = value[key];

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter(isRecord);
};

const readOutputTextContent = (
  value: Record<string, unknown>
): string | null => {
  if (typeof value.text === "string") {
    return value.text;
  }

  return null;
};

const extractOutputText = (payload: unknown): string => {
  if (!isRecord(payload)) {
    throw new Error("OpenAI returned an invalid response.");
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = getRecordArray(payload, "output");

  for (const item of output) {
    const content = getRecordArray(item, "content");

    for (const contentItem of content) {
      const text = readOutputTextContent(contentItem);

      if (text) {
        return text;
      }
    }
  }

  throw new Error("OpenAI response did not include generated text.");
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("OpenAI returned a response that was not valid JSON.");
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
  generateCards: async ({ apiKey, model, systemPrompt, prompt }) => {
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

    const payload = (await response.json()) as unknown;
    const outputText = extractOutputText(payload);
    const parsedJson = parseJson(outputText);
    const result = generatedCardsResponseSchema.safeParse(parsedJson);

    if (!result.success) {
      throw new Error("OpenAI returned invalid flashcard data.");
    }

    return result.data.cards;
  },
};
