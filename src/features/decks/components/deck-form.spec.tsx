import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckForm } from "./deck-form";

const mockListCategories = vi.fn();
const mockUpdateDeck = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    listCategories: (...args: unknown[]) => mockListCategories(...args),
    updateDeck: (...args: unknown[]) => mockUpdateDeck(...args),
    createDeck: vi.fn(),
    createCategory: vi.fn(),
  },
}));

const deck = {
  id: "deck-1",
  title: "Japanese",
  tags: ["language"],
  category: { id: "category-1", name: "Languages" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockListCategories.mockResolvedValue([
    { id: "category-1", name: "Languages", totalDecks: 1 },
  ]);
});

describe("DeckForm", () => {
  it("keeps the edit form open and reports a deck update failure", async () => {
    mockUpdateDeck.mockRejectedValue(new Error("Could not move deck"));
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<DeckForm deck={deck} onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Title")).toHaveValue("Japanese");
      expect(screen.getByLabelText("Category")).toHaveTextContent("Languages");
    });
    await user.click(screen.getByRole("button", { name: "Save deck" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not move deck"
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Save deck" })
    ).toBeInTheDocument();
  });
});
