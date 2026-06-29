import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CARD_LIST_FILTERS } from "../card-list/card-list-filters";
import { DeckCardsToolbar } from "./deck-cards-toolbar";

describe("DeckCardsToolbar", () => {
  it("renders the card summary and filter controls", () => {
    render(
      <DeckCardsToolbar
        searchValue=""
        onSearchChange={vi.fn()}
        filters={DEFAULT_CARD_LIST_FILTERS}
        onFiltersChange={vi.fn()}
        hasFilters={false}
        onClearFilters={vi.fn()}
        totalCards={12}
        filteredCount={12}
      />
    );

    expect(screen.getByText("Flashcards")).toBeInTheDocument();
    expect(screen.getByText("12 of 12 cards")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /search flashcards/i })
    ).toBeInTheDocument();
    expect(screen.getByText("All types")).toBeInTheDocument();
    expect(screen.getByText("All difficulties")).toBeInTheDocument();
  });

  it("calls onClearFilters from the toolbar action", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(
      <DeckCardsToolbar
        searchValue="velocity"
        onSearchChange={vi.fn()}
        filters={{ ...DEFAULT_CARD_LIST_FILTERS, search: "velocity" }}
        onFiltersChange={vi.fn()}
        hasFilters
        onClearFilters={onClearFilters}
        totalCards={2}
        filteredCount={1}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
