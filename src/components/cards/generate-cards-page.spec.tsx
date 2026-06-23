import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GenerateCardsPage } from "./generate-cards-page";

const mockUseListDecks = vi.fn();

vi.mock("@/hooks/decks/use-list-decks", () => ({
  useListDecks: () => mockUseListDecks(),
}));

vi.mock("./generate-cards-form", () => ({
  GenerateCardsForm: ({ deck }: { deck: { title: string } }) => (
    <div data-testid="generate-cards-form">Generate for {deck.title}</div>
  ),
}));

const decks = [
  {
    id: "deck-1",
    title: "Japanese N5",
    tags: [],
    category: { id: "category-1", name: "Languages" },
    cardsDue: 4,
    masteryPercentage: 30,
    totalCards: 20,
  },
  {
    id: "deck-2",
    title: "Python",
    tags: [],
    category: { id: "category-2", name: "Programming" },
    cardsDue: 0,
    masteryPercentage: 70,
    totalCards: 12,
  },
];

const setup = (
  options: { data?: typeof decks; isFetching?: boolean } = {},
) => {
  const user = userEvent.setup();
  mockUseListDecks.mockReturnValue({
    data: options.data ?? decks,
    isFetching: options.isFetching ?? false,
  });
  render(<GenerateCardsPage />);
  return { user };
};

describe("GenerateCardsPage", () => {
  it("shows a loading state while decks load", () => {
    setup({ isFetching: true });

    expect(screen.getByRole("status", { name: /loading decks/i }))
      .toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /generate flashcards/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a deck selector before a deck is selected", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: /generate flashcards/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/select a deck to generate cards/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("generate-cards-form")).not.toBeInTheDocument();
  });

  it("renders the generation form after selecting a deck", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("combobox", { name: /deck/i }));
    await user.click(await screen.findByRole("option", { name: "Python" }));

    expect(screen.getByTestId("generate-cards-form")).toHaveTextContent(
      "Generate for Python",
    );
  });

  it("handles an empty deck list", () => {
    setup({ data: [] });

    expect(screen.getByText(/create a deck first/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /deck/i })).not
      .toBeInTheDocument();
  });
});
