import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeckCardsHeader } from "./deck-cards-header";

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

describe("DeckCardsHeader", () => {
  it("renders deck metadata and navigation actions", () => {
    render(
      <DeckCardsHeader
        deckId="deck-1"
        deckTitle="Japanese N5"
        categoryName="Languages"
        deckTags={["vocab"]}
      />
    );

    expect(screen.getByRole("heading", { name: "Japanese N5" })).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("vocab")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to decks/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Study" })).toHaveAttribute(
      "href",
      "/decks/$deckId/study"
    );
    expect(screen.getByRole("link", { name: /edit deck/i })).toHaveAttribute(
      "href",
      "/decks/$deckId/edit"
    );
    expect(screen.getByRole("link", { name: /generate/i })).toHaveAttribute(
      "href",
      "/decks/$deckId/generate"
    );
  });

  it("calls onCreateCard when New card is clicked", async () => {
    const user = userEvent.setup();
    const onCreateCard = vi.fn();

    render(
      <DeckCardsHeader
        deckId="deck-1"
        deckTitle="Japanese N5"
        categoryName="Languages"
        onCreateCard={onCreateCard}
      />
    );

    await user.click(screen.getByRole("button", { name: /new card/i }));

    expect(onCreateCard).toHaveBeenCalledTimes(1);
  });
});
