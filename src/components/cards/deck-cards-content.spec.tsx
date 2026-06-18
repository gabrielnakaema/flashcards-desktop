import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import type { Deck } from "@/types/deck";
import { DeckCardsContent } from "./deck-cards-content";
import { DEFAULT_CARD_LIST_FILTERS } from "./card-list-filters";

const mockGetDeck = vi.fn();
const mockListCardsByDeck = vi.fn();
const mockCreateCard = vi.fn();
const mockUpdateCard = vi.fn();
const mockDeleteCard = vi.fn();

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

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    getDeck: (...args: unknown[]) => mockGetDeck(...args),
  },
  cardRepository: {
    listCardsByDeck: (...args: unknown[]) => mockListCardsByDeck(...args),
    createCard: (...args: unknown[]) => mockCreateCard(...args),
    updateCard: (...args: unknown[]) => mockUpdateCard(...args),
    deleteCard: (...args: unknown[]) => mockDeleteCard(...args),
  },
}));

const DECK_ID = "deck-1";

const defaultDeck: Deck = {
  id: DECK_ID,
  title: "Japanese N5",
  tags: ["vocab"],
  category: { id: "cat-1", name: "Languages" },
};

function setup() {
  const user = userEvent.setup();
  render(
    <DeckCardsContent
      deckId={DECK_ID}
      cardFilters={DEFAULT_CARD_LIST_FILTERS}
      onCardFiltersChange={vi.fn()}
    />
  );
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDeck.mockResolvedValue(defaultDeck);
  mockListCardsByDeck.mockResolvedValue([]);
  mockCreateCard.mockResolvedValue({
    id: "card-new",
    deckId: DECK_ID,
    type: "plain",
    front: "Q",
    back: "A",
    content: {} as any,
    hint: null,
    explanation: null,
    sourceExcerpt: null,
    difficulty: null,
    tags: [],
    isSuspended: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });
  mockDeleteCard.mockResolvedValue(undefined);
});

describe("DeckCardsContent", () => {
  describe("loading state", () => {
    it("shows a spinner while the deck is being fetched", () => {
      mockGetDeck.mockReturnValue(new Promise(() => {}));
      setup();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("loaded state", () => {
    it("renders the deck title after data loads", async () => {
      setup();
      expect(await screen.findByText("Japanese N5")).toBeInTheDocument();
    });

    it("renders the category name after data loads", async () => {
      setup();
      expect(await screen.findByText("Languages")).toBeInTheDocument();
    });

    it("renders the flashcard workspace actions", async () => {
      setup();
      expect(
        await screen.findByRole("button", { name: /create flashcard/i })
      ).toBeInTheDocument();
      expect(screen.getByText("Flashcards")).toBeInTheDocument();
    });
  });

  describe("create dialog", () => {
    it("defaults to showing the list view (no card form visible)", async () => {
      setup();
      await screen.findByText("Japanese N5");
      expect(
        screen.queryByText("Add a new flashcard to this deck.")
      ).not.toBeInTheDocument();
    });

    it("opens the create form when Create flashcard is clicked", async () => {
      const { user } = setup();
      await screen.findByText("Japanese N5");

      await user.click(
        screen.getByRole("button", { name: /create flashcard/i })
      );

      expect(
        screen.getAllByText("Add a new flashcard to this deck.").length
      ).toBeGreaterThan(0);
    });

    it("closes the create form after CardForm calls onSuccess", async () => {
      const { user } = setup();
      await screen.findByText("Japanese N5");

      await user.click(
        screen.getByRole("button", { name: /create flashcard/i })
      );

      expect(
        screen.getAllByText("Add a new flashcard to this deck.").length
      ).toBeGreaterThan(0);

      await user.type(screen.getByLabelText("Front"), "What is gravity?");
      await user.type(screen.getByLabelText("Back"), "A force");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(
          screen.queryAllByText("Add a new flashcard to this deck.")
        ).toHaveLength(0);
      });
    });
  });

  describe("sidebar", () => {
    it("renders the Generate flashcards section", async () => {
      setup();
      expect(
        await screen.findByText("Generate flashcards")
      ).toBeInTheDocument();
    });
  });
});
