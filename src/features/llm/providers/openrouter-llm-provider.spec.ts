import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openRouterLlmProvider } from "./openrouter-llm-provider";

const mockTauriFetch = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: mockTauriFetch,
}));

const makeOpenRouterCard = () => ({
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

const makeResponse = (content: string): Response =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

const generate = (onCardGenerated?: ReturnType<typeof vi.fn>) =>
  openRouterLlmProvider.generateCards({
    apiKey: "or-test",
    model: "should-be-ignored",
    systemPrompt: "System prompt",
    prompt: "Generate cards",
    onCardGenerated,
  });

beforeEach(() => {
  mockTauriFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("openRouterLlmProvider", () => {
  it("lists only the free router model", async () => {
    const models = await openRouterLlmProvider.listModels({ apiKey: "or-test" });

    expect(mockTauriFetch).not.toHaveBeenCalled();
    expect(openRouterLlmProvider.defaultModel).toBe("openrouter/free");
    expect(models).toEqual([
      { label: "openrouter/free", value: "openrouter/free" },
    ]);
  });

  it("requests structured output from the free router and emits validated cards", async () => {
    mockTauriFetch.mockResolvedValue(
      makeResponse(JSON.stringify({ cards: [makeOpenRouterCard()] }))
    );
    const onCardGenerated = vi.fn();

    const cards = await generate(onCardGenerated);

    expect(mockTauriFetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer or-test",
          "Content-Type": "application/json",
        },
      })
    );

    const request = mockTauriFetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string);

    expect(body).toMatchObject({
      model: "openrouter/free",
      stream: false,
      messages: [
        { role: "system", content: "System prompt" },
        { role: "user", content: "Generate cards" },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "flashcard_generation",
          strict: true,
          schema: {
            type: "object",
            required: ["cards"],
          },
        },
      },
      provider: { require_parameters: true },
    });
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
    expect(onCardGenerated).toHaveBeenCalledTimes(1);
    expect(onCardGenerated).toHaveBeenCalledWith(cards[0]);
  });

  it("uses the OpenRouter error message for unsuccessful responses", async () => {
    mockTauriFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "Invalid OpenRouter API key." } }),
        { status: 401 }
      )
    );

    await expect(generate()).rejects.toThrow("Invalid OpenRouter API key.");
  });

  it("surfaces network rejections clearly", async () => {
    mockTauriFetch.mockRejectedValue(new Error("Connection refused"));

    await expect(generate()).rejects.toThrow(
      "OpenRouter network request failed: Connection refused"
    );
  });

  it("rejects malformed response envelope JSON without emitting cards", async () => {
    mockTauriFetch.mockResolvedValue(new Response("not-json", { status: 200 }));
    const onCardGenerated = vi.fn();

    await expect(generate(onCardGenerated)).rejects.toThrow(
      "OpenRouter returned a response envelope that was not valid JSON."
    );
    expect(onCardGenerated).not.toHaveBeenCalled();
  });

  it("rejects malformed response envelopes without emitting cards", async () => {
    mockTauriFetch.mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), { status: 200 })
    );
    const onCardGenerated = vi.fn();

    await expect(generate(onCardGenerated)).rejects.toThrow(
      "OpenRouter returned an invalid response envelope."
    );
    expect(onCardGenerated).not.toHaveBeenCalled();
  });

  it("rejects malformed flashcard JSON without emitting cards", async () => {
    mockTauriFetch.mockResolvedValue(makeResponse("not-json"));
    const onCardGenerated = vi.fn();

    await expect(generate(onCardGenerated)).rejects.toThrow(
      "OpenRouter returned flashcard content that was not valid JSON."
    );
    expect(onCardGenerated).not.toHaveBeenCalled();
  });

  it("validates the complete card response before emitting any cards", async () => {
    mockTauriFetch.mockResolvedValue(
      makeResponse(
        JSON.stringify({
          cards: [makeOpenRouterCard(), { ...makeOpenRouterCard(), back: null }],
        })
      )
    );
    const onCardGenerated = vi.fn();

    await expect(generate(onCardGenerated)).rejects.toThrow(
      "OpenRouter returned invalid flashcard data."
    );
    expect(onCardGenerated).not.toHaveBeenCalled();
  });
});
