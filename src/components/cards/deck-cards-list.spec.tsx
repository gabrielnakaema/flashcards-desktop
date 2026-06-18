import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Card } from "@/types/card";
import { DeckCardsList } from "./deck-cards-list";
import {
  DEFAULT_CARD_LIST_FILTERS,
  type CardListFilters,
  normalizeCardListFilters,
} from "./card-list-filters";

const mockListCardsByDeck = vi.fn();
const mockDeleteCard = vi.fn();

vi.mock("@/data/repositories", () => ({
  cardRepository: {
    listCardsByDeck: (...args: unknown[]) => mockListCardsByDeck(...args),
    deleteCard: (...args: unknown[]) => mockDeleteCard(...args),
  },
}));

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: "card-1",
  deckId: "deck-1",
  type: "plain",
  front: "What is gravity?",
  back: "A force",
  content: {} as any,
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

function renderDeckCardsList(
  props: Partial<ComponentProps<typeof DeckCardsList>> = {}
) {
  return render(
    <DeckCardsList
      deckId="deck-1"
      filters={DEFAULT_CARD_LIST_FILTERS}
      onFiltersChange={vi.fn()}
      {...props}
    />
  );
}

function ControlledDeckCardsList() {
  const [filters, setFilters] = useState<CardListFilters>(
    DEFAULT_CARD_LIST_FILTERS
  );

  return (
    <DeckCardsList
      deckId="deck-1"
      filters={filters}
      onFiltersChange={(nextFilters) =>
        setFilters((currentFilters) =>
          normalizeCardListFilters({ ...currentFilters, ...nextFilters })
        )
      }
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteCard.mockResolvedValue(undefined);
});

describe("DeckCardsList", () => {
  it("renders each card's front text", async () => {
    mockListCardsByDeck.mockResolvedValue([
      makeCard({ id: "card-1", front: "What is gravity?" }),
      makeCard({ id: "card-2", front: "What is velocity?" }),
    ]);

    renderDeckCardsList();

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    expect(await screen.findByText("What is velocity?")).toBeInTheDocument();
  });

  it("renders an empty state when the query returns an empty array", async () => {
    mockListCardsByDeck.mockResolvedValue([]);

    renderDeckCardsList();

    await waitFor(() => {
      expect(mockListCardsByDeck).toHaveBeenCalled();
    });

    expect(await screen.findByText("No flashcards yet")).toBeInTheDocument();
  });

  it("filters cards by search text", async () => {
    const user = userEvent.setup();
    mockListCardsByDeck.mockResolvedValue([
      makeCard({ id: "card-1", front: "What is gravity?" }),
      makeCard({ id: "card-2", front: "What is velocity?" }),
    ]);

    render(<ControlledDeckCardsList />);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: /search flashcards/i }),
      "velocity"
    );

    await waitFor(() => {
      expect(screen.queryByText("What is gravity?")).not.toBeInTheDocument();
    });
    expect(screen.getByText("What is velocity?")).toBeInTheDocument();
  });

  it("clears active filters", async () => {
    const user = userEvent.setup();
    mockListCardsByDeck.mockResolvedValue([
      makeCard({ id: "card-1", front: "What is gravity?" }),
      makeCard({ id: "card-2", front: "What is velocity?" }),
    ]);

    render(<ControlledDeckCardsList />);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: /search flashcards/i }),
      "velocity"
    );

    await waitFor(() => {
      expect(screen.queryByText("What is gravity?")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByRole("textbox", { name: /search flashcards/i })).toHaveValue("");
    expect(screen.getByText("What is gravity?")).toBeInTheDocument();
    expect(screen.getByText("What is velocity?")).toBeInTheDocument();
  });
});
