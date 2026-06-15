import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckCategoriesContent } from "./deck-categories-content";

const mockListCategories = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();

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

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    listCategories: (...args: unknown[]) => mockListCategories(...args),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
    deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
    listDeckWithStats: vi.fn().mockResolvedValue([]),
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
  },
}));

function setup() {
  const user = userEvent.setup();
  render(<DeckCategoriesContent />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListCategories.mockResolvedValue([]);
  mockCreateCategory.mockResolvedValue({ id: "cat-1", name: "Languages" });
  mockUpdateCategory.mockResolvedValue({
    id: "cat-1",
    name: "World Languages",
  });
  mockDeleteCategory.mockResolvedValue(undefined);
});

async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /^delete$/i }));
}

describe("DeckCategoriesContent", () => {
  it("renders the page heading and back link", async () => {
    setup();

    expect(
      screen.getByRole("heading", { name: /deck categories/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to decks/i })
    ).toHaveAttribute("href", "/");
  });

  it("shows an empty state when there are no categories", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
    });
  });

  it("lists categories in the table", async () => {
    mockListCategories.mockResolvedValue([
      { id: "cat-1", name: "Languages" },
      { id: "cat-2", name: "Math" },
    ]);

    setup();

    await waitFor(() => {
      expect(screen.getByText("Languages")).toBeInTheDocument();
      expect(screen.getByText("Math")).toBeInTheDocument();
    });
  });

  it("opens the create dialog when Create category is clicked", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /create category/i }));

    expect(
      screen.getByRole("heading", { name: /create category/i })
    ).toBeInTheDocument();
  });

  it("opens the edit dialog when the edit action is clicked", async () => {
    mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Languages" }]);
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByText("Languages")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit languages/i }));

    expect(
      screen.getByRole("heading", { name: /edit category/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Languages");
  });

  it("deletes a category when the user confirms", async () => {
    mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Languages" }]);
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByText("Languages")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await confirmDelete(user);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith(
        "cat-1",
        expect.anything()
      );
    });
  });

  it("does not delete a category when the user cancels", async () => {
    mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Languages" }]);
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByText("Languages")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });

  it("shows an error when deletion fails", async () => {
    mockDeleteCategory.mockRejectedValue(new Error("FK constraint"));
    mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Languages" }]);
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByText("Languages")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await confirmDelete(user);

    await waitFor(() => {
      expect(
        screen.getByText(
          /could not delete this category\. it may still be used by one or more decks\./i
        )
      ).toBeInTheDocument();
    });
  });
});
