import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import type { Deck } from "@/types/deck";
import { DeckCardsContent } from "./deck-cards-content";

const mockGetDeck = vi.fn();
const mockListCardsByDeck = vi.fn();
const mockCreateCard = vi.fn();
const mockUpdateCard = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    getDeck: (...args: unknown[]) => mockGetDeck(...args),
  },
  cardRepository: {
    listCardsByDeck: (...args: unknown[]) => mockListCardsByDeck(...args),
    createCard: (...args: unknown[]) => mockCreateCard(...args),
    updateCard: (...args: unknown[]) => mockUpdateCard(...args),
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
  render(<DeckCardsContent deckId={DECK_ID} />);
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
    content: {},
    hint: null,
    explanation: null,
    sourceExcerpt: null,
    difficulty: null,
    tags: [],
    isSuspended: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  });
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

    it("renders the 'List flashcards' and 'Create flashcards' tabs", async () => {
      setup();
      expect(
        await screen.findByRole("button", { name: /list flashcards/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create flashcards/i })
      ).toBeInTheDocument();
    });
  });

  describe("tab navigation", () => {
    it("defaults to showing the list view (no card form visible)", async () => {
      setup();
      await screen.findByText("Japanese N5");
      expect(screen.queryByText("Create flashcard")).not.toBeInTheDocument();
    });

    it("switches to the create view when 'Create flashcards' tab is clicked", async () => {
      const { user } = setup();
      await screen.findByText("Japanese N5");

      await user.click(
        screen.getByRole("button", { name: /create flashcards/i })
      );

      expect(screen.getByText("Create flashcard")).toBeInTheDocument();
    });

    it("switches back to list view after CardForm calls onSuccess", async () => {
      const { user } = setup();
      await screen.findByText("Japanese N5");

      await user.click(
        screen.getByRole("button", { name: /create flashcards/i })
      );

      expect(screen.getByText("Create flashcard")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Front"), "What is gravity?");
      await user.type(screen.getByLabelText("Back"), "A force");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.queryByText("Create flashcard")).not.toBeInTheDocument();
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
