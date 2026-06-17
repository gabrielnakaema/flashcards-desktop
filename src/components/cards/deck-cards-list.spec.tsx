import { render, screen, waitFor } from "@/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Card } from "@/types/card";
import { DeckCardsList } from "./deck-cards-list";

const mockListCardsByDeck = vi.fn();

vi.mock("@/data/repositories", () => ({
  cardRepository: {
    listCardsByDeck: (...args: unknown[]) => mockListCardsByDeck(...args),
  },
}));

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: "card-1",
  deckId: "deck-1",
  type: "plain",
  front: "What is gravity?",
  back: "A force",
  content: {},
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: [],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DeckCardsList", () => {
  it("renders each card's front text", async () => {
    mockListCardsByDeck.mockResolvedValue([
      makeCard({ id: "card-1", front: "What is gravity?" }),
      makeCard({ id: "card-2", front: "What is velocity?" }),
    ]);

    render(<DeckCardsList deckId="deck-1" />);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    expect(await screen.findByText("What is velocity?")).toBeInTheDocument();
  });

  it("renders nothing when the query returns an empty array", async () => {
    mockListCardsByDeck.mockResolvedValue([]);

    const { container } = render(<DeckCardsList deckId="deck-1" />);

    await waitFor(() => {
      expect(mockListCardsByDeck).toHaveBeenCalled();
    });

    expect(container.querySelectorAll("h1")).toHaveLength(0);
  });
});
