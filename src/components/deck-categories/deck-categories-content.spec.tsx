import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckCategoriesContent } from "./deck-categories-content";
import { ComponentProps } from "react";
import type { DeckCategory } from "@/types/deck";

const mockListCategories = vi.fn();
const mockCreateCategory = vi.fn();

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

vi.mock("./deck-category-row", () => ({
  DeckCategoryRow: ({ category }: { category: DeckCategory }) => (
    <div data-testid="deck-category-row">{category.name}</div>
  ),
}));

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    listCategories: (...args: unknown[]) => mockListCategories(...args),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    listDeckWithStats: vi.fn().mockResolvedValue([]),
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
  },
}));

function setup(
  props: Partial<ComponentProps<typeof DeckCategoriesContent>> = {}
) {
  const user = userEvent.setup();
  render(<DeckCategoriesContent onClose={vi.fn()} {...props} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListCategories.mockResolvedValue([]);
  mockCreateCategory.mockResolvedValue({
    id: "cat-1",
    name: "Languages",
    totalDecks: 1,
  });
});

describe("DeckCategoriesContent", () => {
  it("renders the page heading", async () => {
    setup();

    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("closes on done button click", async () => {
    const onClose = vi.fn();
    const { user } = setup({ onClose });
    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders close button and can close the content", async () => {
    const onClose = vi.fn();
    const { user } = setup({ onClose });
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an empty state when there are no categories", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
    });
  });

  it("shows a loading state while categories are fetching", () => {
    mockListCategories.mockReturnValue(createDeferred<DeckCategory[]>().promise);

    setup();

    expect(screen.getByText(/loading categories/i)).toBeInTheDocument();
  });

  it("lists categories", async () => {
    mockListCategories.mockResolvedValue([
      { id: "cat-1", name: "Languages", totalDecks: 1 },
      { id: "cat-2", name: "Math", totalDecks: 0 },
      { id: "cat-3", name: "Science", totalDecks: 2 },
    ]);

    setup();

    await waitFor(() => {
      expect(screen.getByText("Languages")).toBeInTheDocument();
      expect(screen.getByText("Math")).toBeInTheDocument();
      expect(screen.getByText("Science")).toBeInTheDocument();
      expect(screen.getAllByTestId("deck-category-row")).toHaveLength(3);
    });
  });
});

describe("Create category form", () => {
  it("renders category name input and create button", async () => {
    setup();
    expect(screen.getByLabelText("New category")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^create$/i })
    ).toBeInTheDocument();
  });

  it("creates a new category when the user types a name and clicks Create", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("New category"), "Languages");
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    expect(mockCreateCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Languages" }),
      expect.anything()
    );
  });

  it("clears the category name input after creating a category", async () => {
    const { user } = setup();
    const nameInput = screen.getByLabelText("New category");

    await user.type(nameInput, "Languages");
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(nameInput).toHaveValue("");
  });

  it("does not create a new category when the user clicks Create and the input is empty", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /^create$/i }));
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });
});
