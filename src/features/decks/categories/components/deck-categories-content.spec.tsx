import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckCategoriesContent } from "./deck-categories-content";

const mockListCategories = vi.fn();
const mockCreateCategory = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: React.ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    listCategories: (...args: unknown[]) => mockListCategories(...args),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockListCategories.mockResolvedValue([
    { id: "category-1", name: "Languages", totalDecks: 2 },
  ]);
  mockCreateCategory.mockResolvedValue({
    id: "category-2",
    name: "Science",
    totalDecks: 0,
  });
});

describe("DeckCategoriesContent", () => {
  it("makes persisted deck reorganization discoverable", async () => {
    render(<DeckCategoriesContent />);

    expect(
      screen.getByRole("heading", { name: "Move decks between categories" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/open a deck’s menu, choose edit/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse decks/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(await screen.findByText("Languages")).toBeInTheDocument();
  });

  it("creates a trimmed category and clears the input only after success", async () => {
    const user = userEvent.setup();
    render(<DeckCategoriesContent />);

    const input = screen.getByLabelText("New category");
    await user.type(input, "  Science  ");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(mockCreateCategory.mock.calls[0]?.[0]).toEqual({
        name: "Science",
      });
      expect(input).toHaveValue("");
    });
  });
});
