import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckCategoryRow } from "./deck-category-row";

const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
    deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  },
}));

const category = {
  id: "category-1",
  name: "Languages",
  totalDecks: 1,
};

const setup = (totalDecks = 1) => {
  const user = userEvent.setup();
  render(<DeckCategoryRow category={{ ...category, totalDecks }} />);
  return { user };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateCategory.mockResolvedValue({
    ...category,
    name: "World Languages",
  });
  mockDeleteCategory.mockResolvedValue(undefined);
});

describe("DeckCategoryRow", () => {
  it("renames a category and exits edit mode after the update succeeds", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Edit Languages" }));
    const input = screen.getByLabelText("Name");
    await user.clear(input);
    await user.type(input, "  World Languages  ");
    await user.click(screen.getByRole("button", { name: "Save Languages" }));

    await waitFor(() => {
      expect(mockUpdateCategory.mock.calls[0]?.[0]).toEqual({
        id: "category-1",
        name: "World Languages",
      });
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    });
  });

  it("keeps the editor open and reports an update failure", async () => {
    mockUpdateCategory.mockRejectedValue(new Error("Name already exists"));
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Edit Languages" }));
    await user.click(screen.getByRole("button", { name: "Save Languages" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name already exists"
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("rejects a blank category name before calling the repository", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Edit Languages" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Save Languages" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    expect(mockUpdateCategory).not.toHaveBeenCalled();
  });

  it("does not delete when destructive confirmation is cancelled", async () => {
    const { user } = setup(0);

    await user.click(screen.getByRole("button", { name: "Delete Languages" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockDeleteCategory).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: /delete “languages”/i })
    ).not.toBeInTheDocument();
  });

  it("deletes an empty category after explicit confirmation", async () => {
    const { user } = setup(0);

    await user.click(screen.getByRole("button", { name: "Delete Languages" }));
    expect(
      screen.getByText(/decks and cards are never deleted automatically/i)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete category" }));

    await waitFor(() => {
      expect(mockDeleteCategory.mock.calls[0]?.[0]).toBe("category-1");
      expect(
        screen.queryByRole("heading", { name: /delete “languages”/i })
      ).not.toBeInTheDocument();
    });
  });

  it("keeps a non-empty category and surfaces repository guidance", async () => {
    mockDeleteCategory.mockRejectedValue(
      new Error(
        "This category has decks. Move or delete those decks before deleting the category."
      )
    );
    const { user } = setup(2);

    await user.click(screen.getByRole("button", { name: "Delete Languages" }));
    expect(screen.getByText(/contains 2 decks/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete category" }));

    expect(
      await screen.findByText(/this category has decks/i)
    ).toHaveTextContent(
      "Move or delete those decks before deleting the category."
    );
    expect(
      screen.getByRole("heading", { name: /delete “languages”/i })
    ).toBeInTheDocument();
  });
});
