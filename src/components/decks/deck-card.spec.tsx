import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeckCard } from "./deck-card";
import { ComponentProps } from "react";

vi.mock("./deck-card-mastery-progress", () => ({
  DeckCardMasteryProgress: ({
    percentage,
  }: {
    percentage: number;
    lastReviewedAt: string | null;
    backgroundColor: string;
  }) => (
    <div
      data-testid="deck-card-mastery-progress"
      data-percentage={percentage}
    />
  ),
}));

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

const mockDeck = {
  id: "deck-1",
  title: "Deck 1",
  tags: ["tag1", "tag2"],
  category: { id: "cat-1", name: "Category 1" },
  cardsDue: 10,
  masteryPercentage: 50,
  totalCards: 20,
  lastReviewedAt: null,
};

const defaultProps: ComponentProps<typeof DeckCard> = {
  deck: mockDeck,
  deckColorClassName: "bg-orange-400",
};

function setup(props: Partial<ComponentProps<typeof DeckCard>> = {}) {
  const user = userEvent.setup();
  render(<DeckCard {...defaultProps} {...props} />);
  return { user };
}

describe("DeckCard", () => {
  it("renders cards due badge when cards due is greater than 0", () => {
    setup();
    expect(screen.getByText(/^\d+ due$/i)).toBeInTheDocument();
  });

  it("hides the due badge when cards due is 0", () => {
    setup({ deck: { ...mockDeck, cardsDue: 0 } });
    expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
  });

  it("passes mastery percentage to DeckCardMasteryProgress", () => {
    setup({ deck: { ...mockDeck, masteryPercentage: 50 } });
    expect(screen.getByTestId("deck-card-mastery-progress")).toHaveAttribute(
      "data-percentage",
      "50"
    );
  });
});
