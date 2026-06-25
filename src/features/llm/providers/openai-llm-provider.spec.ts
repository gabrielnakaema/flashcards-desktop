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

const makeSecondOpenAiCard = () => ({
  ...makeOpenAiCard(),
  front: "What is inertia?",
  back: "Resistance to a change in motion.",
});

const makeStreamResponse = (outputText: string): Response =>
  new Response(
    `data: ${JSON.stringify({
      type: "response.output_text.delta",
      delta: outputText,
    })}\n\ndata: ${JSON.stringify({ type: "response.completed" })}\n\n`,
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }
  );

beforeEach(() => {
  mockTauriFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("openAiLlmProvider", () => {
  it("lists available models", async () => {
    const models = await openAiLlmProvider.listModels({ apiKey: "sk-test" });

    expect(mockTauriFetch).not.toHaveBeenCalled();
    expect(models).toHaveLength(10);
    expect(models).toContainEqual({ label: "gpt-5.5", value: "gpt-5.5" });
    expect(models).toContainEqual({
      label: "gpt-4.1-mini",
      value: "gpt-4.1-mini",
    });
  });

  it("requests structured outputs and returns generated cards", async () => {
    mockTauriFetch.mockResolvedValue(
      makeStreamResponse(JSON.stringify({ cards: [makeOpenAiCard()] }))
    );

    const cards = await openAiLlmProvider.generateCards({
      apiKey: "sk-test",
      model: "gpt-test",
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

    expect(body.model).toBe("gpt-test");
    expect(body.stream).toBe(true);
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

  it("emits cards as complete objects arrive in the response stream", async () => {
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        streamController = controller;
      },
    });
    mockTauriFetch.mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    const onCardGenerated = vi.fn();
    const generation = openAiLlmProvider.generateCards({
      apiKey: "sk-test",
      model: "gpt-test",
      systemPrompt: "System prompt",
      prompt: "Generate cards",
      onCardGenerated,
    });
    const firstDelta = `{"cards":[${JSON.stringify(makeOpenAiCard())},`;

    streamController!.enqueue(
      new TextEncoder().encode(
        `data: ${JSON.stringify({
          type: "response.output_text.delta",
          delta: firstDelta,
        })}\n\n`
      )
    );

    await vi.waitFor(() => {
      expect(onCardGenerated).toHaveBeenCalledTimes(1);
    });
    expect(onCardGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ front: "What is gravity?" })
    );

    streamController!.enqueue(
      new TextEncoder().encode(
        `data: ${JSON.stringify({
          type: "response.output_text.delta",
          delta: `${JSON.stringify(makeSecondOpenAiCard())}]}`,
        })}\n\ndata: ${JSON.stringify({
          type: "response.completed",
        })}\n\n`
      )
    );
    streamController!.close();

    const cards = await generation;

    expect(onCardGenerated).toHaveBeenCalledTimes(2);
    expect(cards.map((card) => card.front)).toEqual([
      "What is gravity?",
      "What is inertia?",
    ]);
  });

  it("cancels the response reader when a stream event fails", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: "response.failed",
              response: { error: { message: "Generation failed." } },
            })}\n\n`
          )
        );
      },
      cancel,
    });
    mockTauriFetch.mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    await expect(
      openAiLlmProvider.generateCards({
        apiKey: "sk-test",
        model: "gpt-test",
        systemPrompt: "System prompt",
        prompt: "Generate cards",
      })
    ).rejects.toThrow("Generation failed.");

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid generated card data", async () => {
    mockTauriFetch.mockResolvedValue(
      makeStreamResponse(
        JSON.stringify({
          cards: [{ ...makeOpenAiCard(), back: null }],
        })
      )
    );

    await expect(
      openAiLlmProvider.generateCards({
        apiKey: "sk-test",
        model: "gpt-test",
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
        model: "gpt-test",
        systemPrompt: "System prompt",
        prompt: "Generate cards",
      })
    ).rejects.toThrow("Incorrect API key provided.");
  });
});
