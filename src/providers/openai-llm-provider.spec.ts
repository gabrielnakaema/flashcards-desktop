import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openAiLlmProvider } from "./openai-llm-provider";

const mockTauriFetch = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: mockTauriFetch,
}));

const makeOpenAiCard = () => ({
  type: "plain",
  front: "What is gravity?",
  back: "A force that attracts mass.",
  content: {
    question: null,
    choices: null,
    correctChoiceId: null,
    prompt: null,
    acceptedAnswer: null,
    aliases: null,
    caseSensitive: null,
  },
  hint: null,
  explanation: "Gravity is the force of attraction between masses.",
  sourceExcerpt: null,
  difficulty: "easy",
  tags: ["physics"],
});

const makeResponse = (payload: unknown): Response => {
  return {
    ok: true,
    json: async () => payload,
  } as Response;
};

beforeEach(() => {
  mockTauriFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("openAiLlmProvider", () => {
  it("requests structured outputs and returns generated cards", async () => {
    const payload = {
      output_text: JSON.stringify({ cards: [makeOpenAiCard()] }),
    };
    mockTauriFetch.mockResolvedValue(makeResponse(payload));

    const cards = await openAiLlmProvider.generateCards({
      apiKey: "sk-test",
      systemPrompt: "System prompt",
      prompt: "Generate cards",
    });

    expect(mockTauriFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
          "Content-Type": "application/json",
        }),
      })
    );

    const request = mockTauriFetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string);

    expect(body.text.format.type).toBe("json_schema");
    expect(body.text.format.strict).toBe(true);
    expect(body.text.format.schema.required).toEqual(["cards"]);
    expect(cards).toEqual([
      {
        type: "plain",
        front: "What is gravity?",
        back: "A force that attracts mass.",
        explanation: "Gravity is the force of attraction between masses.",
        difficulty: "easy",
        tags: ["physics"],
      },
    ]);
  });

  it("rejects invalid generated card data", async () => {
    const payload = {
      output_text: JSON.stringify({
        cards: [{ ...makeOpenAiCard(), back: null }],
      }),
    };
    mockTauriFetch.mockResolvedValue(makeResponse(payload));

    await expect(
      openAiLlmProvider.generateCards({
        apiKey: "sk-test",
        systemPrompt: "System prompt",
        prompt: "Generate cards",
      })
    ).rejects.toThrow("OpenAI returned invalid flashcard data.");
  });

  it("uses the OpenAI error message when the request fails", async () => {
    mockTauriFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({ error: { message: "Incorrect API key provided." } }),
    } as Response);

    await expect(
      openAiLlmProvider.generateCards({
        apiKey: "sk-test",
        systemPrompt: "System prompt",
        prompt: "Generate cards",
      })
    ).rejects.toThrow("Incorrect API key provided.");
  });
});
