import { render, screen } from "@/test-utils";
import type { DeckWithStats } from "@/features/decks";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

const mockUseListDecks = vi.fn();
let mockPathname = "/";

vi.mock("@/features/decks", () => ({
  useListDecks: () => mockUseListDecks(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to: string;
    params?: { deckId: string };
    children: React.ReactNode;
  }) => {
    const href = params?.deckId ? to.replace("$deckId", params.deckId) : to;
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
  useRouterState: ({ select }: { select: (state: unknown) => string }) =>
    select({ location: { pathname: mockPathname } }),
}));

const decks: DeckWithStats[] = [
  {
    id: "deck-1",
    title: "Japanese N5",
    tags: [],
    category: { id: "category-1", name: "Languages" },
    cardsDue: 4,
    masteryPercentage: 30,
    totalCards: 20,
    lastReviewedAt: null,
  },
  {
    id: "deck-2",
    title: "Python",
    tags: [],
    category: { id: "category-2", name: "Programming" },
    cardsDue: 0,
    masteryPercentage: 70,
    totalCards: 12,
    lastReviewedAt: null,
  },
];

const setup = (
  options: { pathname?: string; decks?: DeckWithStats[] } = {}
) => {
  mockPathname = options.pathname ?? "/";
  mockUseListDecks.mockReturnValue({
    data: options.decks ?? decks,
    isFetching: false,
  });

  render(<Sidebar />);
};

describe("Sidebar", () => {
  it("renders primary navigation, deck links, and streak placeholder", () => {
    setup();

    expect(
      screen.getAllByRole("link", { name: /flashcards/i })[0]
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /home/i })[0]).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getAllByRole("link", { name: /review/i })[0]).toHaveAttribute(
      "href",
      "/decks/deck-1/study"
    );
    expect(
      screen.getAllByRole("link", { name: /japanese n5/i })[0]
    ).toHaveAttribute("href", "/decks/deck-1/cards");
    expect(screen.getByText("12-day streak")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /generate/i })
    ).not.toBeInTheDocument();
  });

  it("links Review to home when no cards are due", () => {
    setup({
      decks: decks.map((deck) => ({ ...deck, cardsDue: 0 })),
    });

    expect(screen.getAllByRole("link", { name: /review/i })[0]).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("marks active home and deck links", () => {
    setup({ pathname: "/decks/deck-1/cards" });

    expect(screen.getAllByRole("link", { name: /japanese n5/i })[0])
      .toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: /python/i })[0]).not
      .toHaveAttribute("aria-current");
  });

  it("shows due badges only for decks with due cards", () => {
    setup();

    const japaneseLink = screen.getAllByRole("link", {
      name: /japanese n5/i,
    })[0];
    const pythonLink = screen.getAllByRole("link", { name: /python/i })[0];

    expect(japaneseLink).toHaveTextContent("4");
    expect(pythonLink).not.toHaveTextContent("0");
  });

  it("handles an empty deck list", () => {
    setup({ decks: [] });

    expect(screen.getByText(/no decks yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /review/i })[0]).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("shows loading deck placeholders while decks load", () => {
    mockPathname = "/";
    mockUseListDecks.mockReturnValue({ data: [], isFetching: true });

    render(<Sidebar />);

    expect(
      screen.getByRole("status", { name: /loading decks/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/no decks yet/i)).not.toBeInTheDocument();
  });
});
