import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@/test-utils";
import type { Deck } from "@/features/decks";
import { DeckGenerateCardsContent } from "./deck-generate-cards-content";

const mockGenerateCards = vi.fn();
const mockBulkCreateCards = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/llm")>();
  return {
    ...actual,
    defaultLlmProvider: {
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-4.1-mini",
    },
    getLlmProvider: () => ({
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-4.1-mini",
      listModels: vi.fn().mockResolvedValue([
        { label: "gpt-4.1-mini", value: "gpt-4.1-mini" },
      ]),
      generateCards: (...args: unknown[]) => mockGenerateCards(...args),
    }),
    getLlmProviderOptions: () => [{ label: "OpenAI", value: "openai" }],
  };
});

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    getDeck: vi.fn(),
  },
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

vi.mock("@/features/decks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/decks")>();
  return {
    ...actual,
    useDeckDetails: () => ({
      data: deck,
      isFetching: false,
      isError: false,
    }),
  };
});

const setup = () => {
  const user = userEvent.setup();
  render(<DeckGenerateCardsContent deckId="deck-1" />);
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

describe("DeckGenerateCardsContent", () => {
  it("renders the deck-scoped generation page", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: /generate studio/i })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Physics")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/decks/$deckId/cards"
    );
  });

  it("appends the locked response prompt and previews generated cards without saving", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /\+ generate cards/i }));

    await waitFor(() => {
      expect(mockGenerateCards).toHaveBeenCalledTimes(1);
    });

    const request = mockGenerateCards.mock.calls[0][0] as {
      apiKey: string;
      model: string;
      prompt: string;
      systemPrompt: string;
    };

    expect(request.apiKey).toBe("sk-test");
    expect(request.model).toBe("gpt-4.1-mini");
    expect(request.prompt).toBe(
      "Generate 10 flashcards for the topic: Physics"
    );
    expect(request.systemPrompt).toContain("Field guide:");
    expect(request.systemPrompt).toContain(
      "Always return flashcards in the required response format."
    );

    expect(mockBulkCreateCards).not.toHaveBeenCalled();
    expect(await screen.findByText("What is gravity?")).toBeVisible();
    expect(screen.getByText("A force that attracts mass.")).toBeVisible();
    expect(screen.getByText("1 of 1 drafts selected.")).toBeVisible();
  });

  it("previews cards before generation finishes", async () => {
    let finishGeneration: ((cards: unknown[]) => void) | undefined;
    const streamedCard = {
      type: "plain",
      front: "Streamed question",
      back: "Streamed answer",
    };
    mockGenerateCards.mockImplementation(
      ({
        onCardGenerated,
      }: {
        onCardGenerated?: (card: typeof streamedCard) => void;
      }) => {
        onCardGenerated?.(streamedCard);
        return new Promise((resolve) => {
          finishGeneration = resolve;
        });
      }
    );
    const { user } = setup();

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /\+ generate cards/i }));

    expect(await screen.findByText("Streamed question")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /generating/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("progressbar", { name: /generating card 2/i })
    ).toBeVisible();
    expect(screen.getByText("Composing card 2")).toBeVisible();
    expect(screen.getByText("Streamed question").closest("tr")).toHaveClass(
      "generated-card-enter"
    );

    finishGeneration?.([streamedCard]);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /\+ generate cards/i })
      ).toBeEnabled();
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("keeps discarded drafts removed as later cards stream in", async () => {
    let emitCard: ((card: { type: "plain"; front: string; back: string }) => void)
      | undefined;
    let finishGeneration:
      | ((cards: { type: "plain"; front: string; back: string }[]) => void)
      | undefined;
    const cards = ["First", "Discarded", "Third", "Fourth"].map((front) => ({
      type: "plain" as const,
      front,
      back: `${front} answer`,
    }));
    mockGenerateCards.mockImplementation(
      ({
        onCardGenerated,
      }: {
        onCardGenerated?: (card: (typeof cards)[number]) => void;
      }) => {
        emitCard = onCardGenerated;
        cards.slice(0, 3).forEach((card) => onCardGenerated?.(card));
        return new Promise((resolve) => {
          finishGeneration = resolve;
        });
      }
    );
    const { user } = setup();

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /\+ generate cards/i }));
    await screen.findByText("Discarded");

    await user.click(screen.getAllByRole("button", { name: "Discard" })[1]);
    act(() => emitCard?.(cards[3]));

    expect(await screen.findByText("Fourth")).toBeVisible();
    expect(screen.queryByText("Discarded")).not.toBeInTheDocument();
    expect(screen.getAllByText("Third")).toHaveLength(1);

    act(() => finishGeneration?.(cards));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save selected cards/i })
      ).toBeEnabled();
    });
    await user.click(
      screen.getByRole("button", { name: /save selected cards/i })
    );

    await waitFor(() => {
      expect(mockBulkCreateCards).toHaveBeenCalledTimes(1);
    });
    expect(
      mockBulkCreateCards.mock.calls[0][0].map(
        (card: { front: string }) => card.front
      )
    ).toEqual(["First", "Third", "Fourth"]);
  });

  it("saves approved generated cards after edits", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /\+ generate cards/i }));
    await screen.findByText("What is gravity?");

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

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /\+ generate cards/i }));
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

  it("shows provider errors and does not create cards", async () => {
    mockGenerateCards.mockRejectedValue(new Error("Provider failed"));
    const { user } = setup();

    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /\+ generate cards/i }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Provider failed");
    expect(mockBulkCreateCards).not.toHaveBeenCalled();
  });
});
