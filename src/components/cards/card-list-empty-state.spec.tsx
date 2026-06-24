import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardListEmptyState } from "./card-list-empty-state";

describe("CardListEmptyState", () => {
  it("renders the loading state", () => {
    render(<CardListEmptyState variant="loading" />);
    expect(screen.getByText("Loading flashcards...")).toBeInTheDocument();
  });

  it("renders the error state", () => {
    render(
      <CardListEmptyState variant="error" errorMessage="Something went wrong" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("renders the empty deck state with a create action", async () => {
    const user = userEvent.setup();
    const onCreateCard = vi.fn();

    render(
      <CardListEmptyState variant="no-cards" onCreateCard={onCreateCard} />
    );

    await user.click(
      screen.getByRole("button", { name: /create first flashcard/i })
    );

    expect(onCreateCard).toHaveBeenCalledTimes(1);
  });

  it("renders the filtered empty state with a clear action", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(
      <CardListEmptyState
        variant="no-results"
        onClearFilters={onClearFilters}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
