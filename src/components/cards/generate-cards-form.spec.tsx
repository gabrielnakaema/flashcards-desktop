import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import type { Deck } from "@/types/deck";
import { GenerateCardsForm } from "./generate-cards-form";

const mockGenerateCards = vi.fn();
const mockBulkCreateCards = vi.fn();

vi.mock("@/providers/llm-provider", () => ({
  getLlmProvider: () => ({
    id: "openai",
    generateCards: (...args: unknown[]) => mockGenerateCards(...args),
  }),
}));

vi.mock("@/data/repositories", () => ({
  cardRepository: {
    bulkCreateCards: (...args: unknown[]) => mockBulkCreateCards(...args),
  },
}));

const deck: Deck = {
  id: "deck-1",
  title: "Physics",
  tags: [],
  category: {
    id: "category-1",
    name: "Science",
  },
};

const setup = () => {
  const user = userEvent.setup();
  render(<GenerateCardsForm deck={deck} />);
  return { user };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateCards.mockResolvedValue([
    {
      type: "plain",
      front: "What is gravity?",
      back: "A force that attracts mass.",
      tags: ["physics"],
    },
  ]);
  mockBulkCreateCards.mockResolvedValue([]);
});

describe("GenerateCardsForm", () => {
  it("appends the locked response prompt and previews generated cards without saving", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));

    await waitFor(() => {
      expect(mockGenerateCards).toHaveBeenCalledTimes(1);
    });

    const request = mockGenerateCards.mock.calls[0][0] as {
      apiKey: string;
      prompt: string;
      systemPrompt: string;
    };

    expect(request.apiKey).toBe("sk-test");
    expect(request.prompt).toBe(
      "Generate 10 flashcards for the topic: Physics"
    );
    expect(request.systemPrompt).toContain("Field guide:");
    expect(request.systemPrompt).toContain(
      "Always return flashcards in the required response format."
    );

    expect(mockBulkCreateCards).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("dialog", { name: /review generated cards/i })
    ).toBeVisible();
    expect(screen.getByText("What is gravity?")).toBeVisible();
    expect(screen.getByText("A force that attracts mass.")).toBeVisible();
    expect(screen.getByText("1 of 1 drafts selected.")).toBeVisible();
  });

  it("saves approved generated cards after edits", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByRole("dialog", { name: /review generated cards/i });

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.clear(screen.getByDisplayValue("What is gravity?"));
    await user.type(
      screen.getByLabelText("Front", { selector: "textarea" }),
      "What does gravity do?"
    );
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    await user.click(
      screen.getByRole("button", { name: /save selected cards/i })
    );

    await waitFor(() => {
      expect(mockBulkCreateCards).toHaveBeenCalledTimes(1);
    });

    expect(mockBulkCreateCards.mock.calls[0][0]).toEqual([
      {
        type: "plain",
        front: "What does gravity do?",
        back: "A force that attracts mass.",
        tags: ["physics"],
        deckId: "deck-1",
      },
    ]);

    expect(screen.getByRole("status")).toHaveTextContent("Saved 1 flashcards.");
  });

  it("does not save discarded generated cards", async () => {
    mockGenerateCards.mockResolvedValue([
      {
        type: "plain",
        front: "Keep this card?",
        back: "Yes.",
      },
      {
        type: "plain",
        front: "Discard this card?",
        back: "No.",
      },
    ]);
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByText("Discard this card?");

    await user.click(screen.getAllByRole("button", { name: "Discard" })[1]);
    await user.click(
      screen.getByRole("button", { name: /save selected cards/i })
    );

    await waitFor(() => {
      expect(mockBulkCreateCards).toHaveBeenCalledTimes(1);
    });

    expect(mockBulkCreateCards.mock.calls[0][0]).toEqual([
      {
        type: "plain",
        front: "Keep this card?",
        back: "Yes.",
        deckId: "deck-1",
      },
    ]);
  });

  it("discards selected cards from the table", async () => {
    mockGenerateCards.mockResolvedValue([
      {
        type: "plain",
        front: "Keep this card?",
        back: "Yes.",
      },
      {
        type: "plain",
        front: "Discard selected card?",
        back: "No.",
      },
    ]);
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByText("Discard selected card?");

    await user.click(screen.getByLabelText("Select card 1 for save"));
    await user.click(screen.getByRole("button", { name: /discard selected/i }));
    await user.click(screen.getByRole("button", { name: /select all/i }));
    await user.click(
      screen.getByRole("button", { name: /save selected cards/i })
    );

    await waitFor(() => {
      expect(mockBulkCreateCards).toHaveBeenCalledTimes(1);
    });

    expect(mockBulkCreateCards.mock.calls[0][0]).toEqual([
      {
        type: "plain",
        front: "Keep this card?",
        back: "Yes.",
        deckId: "deck-1",
      },
    ]);
  });

  it("saves approved multiple choice and typed answer content", async () => {
    mockGenerateCards.mockResolvedValue([
      {
        type: "multiple_choice",
        front: "Largest planet?",
        content: {
          choices: [
            { id: "a", text: "Earth" },
            { id: "b", text: "Jupiter" },
          ],
          correctChoiceId: "b",
        },
      },
      {
        type: "typed_answer",
        front: "Capital of France?",
        content: {
          acceptedAnswer: "Paris",
          aliases: ["paris"],
          caseSensitive: false,
        },
      },
    ]);
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByText("Largest planet?");
    await user.click(
      screen.getByRole("button", { name: /save selected cards/i })
    );

    await waitFor(() => {
      expect(mockBulkCreateCards).toHaveBeenCalledTimes(1);
    });

    expect(mockBulkCreateCards.mock.calls[0][0]).toEqual([
      {
        type: "multiple_choice",
        front: "Largest planet?",
        content: {
          question: "Largest planet?",
          choices: [
            { id: "a", text: "Earth" },
            { id: "b", text: "Jupiter" },
          ],
          correctChoiceId: "b",
        },
        deckId: "deck-1",
      },
      {
        type: "typed_answer",
        front: "Capital of France?",
        content: {
          prompt: "Capital of France?",
          acceptedAnswer: "Paris",
          aliases: ["paris"],
          caseSensitive: false,
        },
        deckId: "deck-1",
      },
    ]);
  });

  it("requires at least one approved card before saving", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByRole("dialog", { name: /review generated cards/i });

    await user.click(screen.getByLabelText("Select card 1 for save"));
    await user.click(
      screen.getByRole("button", { name: /save selected cards/i })
    );

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(
      "Select at least one generated card before saving."
    );
    expect(mockBulkCreateCards).not.toHaveBeenCalled();
  });

  it("validates approved cards before saving", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));
    await screen.findByRole("dialog", { name: /review generated cards/i });

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.clear(screen.getByDisplayValue("A force that attracts mass."));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText("Back is required for plain cards")
    ).toBeVisible();
    expect(mockBulkCreateCards).not.toHaveBeenCalled();
  });

  it("shows provider errors and does not create cards", async () => {
    mockGenerateCards.mockRejectedValue(new Error("Provider failed"));
    const { user } = setup();

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /^generate$/i }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Provider failed");
    expect(mockBulkCreateCards).not.toHaveBeenCalled();
  });
});
