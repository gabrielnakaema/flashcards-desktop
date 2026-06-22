import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeckCard } from "./deck-card";
import { ComponentProps } from "react";

vi.mock("./deck-card-mastery-progress", () => ({
  DeckCardMasteryProgress: ({ percentage }: { percentage: number }) => (
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
};

function setup(
  props: Partial<ComponentProps<typeof DeckCard>> = { deck: mockDeck },
) {
  const user = userEvent.setup();
  render(<DeckCard deck={mockDeck} {...props} />);
  return { user };
}

describe("DeckCard", () => {
  it("renders cards due badge when cards due is greater than 0", () => {
    setup();
    const cardsDueBadge = screen.getByText(/^\d+ cards? due$/i);
    expect(cardsDueBadge).toBeInTheDocument();
  });

  it("renders caught up badge when cards due is 0", () => {
    setup({ deck: { ...mockDeck, cardsDue: 0 } });
    const caughtUpBadge = screen.getByText("Caught up!");
    expect(caughtUpBadge).toBeInTheDocument();
  });

  it("passes mastery percentage to DeckCardMasteryProgress", () => {
    setup({ deck: { ...mockDeck, masteryPercentage: 50 } });
    expect(screen.getByTestId("deck-card-mastery-progress")).toHaveAttribute(
      "data-percentage",
      "50",
    );
  });
});
