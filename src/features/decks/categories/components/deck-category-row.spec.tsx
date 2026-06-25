import { act, render, screen, waitFor } from "@/test-utils";
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
  id: "cat-1",
  name: "Languages",
  totalDecks: 1,
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function setup(props: Partial<typeof category> = {}) {
  const user = userEvent.setup();
  render(<DeckCategoryRow category={{ ...category, ...props }} />);
  return { user };
}

async function confirmDelete(
  user: ReturnType<typeof userEvent.setup>,
  categoryName: string,
) {
  await user.click(
    await screen.findByRole("button", { name: `Delete ${categoryName}` }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateCategory.mockResolvedValue({
    id: "cat-1",
    name: "World Languages",
    totalDecks: 1,
  });
  mockDeleteCategory.mockResolvedValue(undefined);
});

describe("DeckCategoryRow", () => {
  it("renders category name and singular deck count", () => {
    setup();

    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("1 deck")).toBeInTheDocument();
  });

  it("renders plural deck count", () => {
    setup({ totalDecks: 2 });

    expect(screen.getByText("2 decks")).toBeInTheDocument();
  });

  it("enters edit mode when the edit action is clicked", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /edit languages/i }));

    expect(screen.getByLabelText("Name")).toHaveValue("Languages");
    expect(
      screen.getByRole("button", { name: /cancel editing languages/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update languages/i }),
    ).toBeInTheDocument();
  });

  it("updates a category name when the user types a new name and clicks Update", async () => {
    const { user } = setup({ totalDecks: 0 });

    await user.click(screen.getByRole("button", { name: /edit languages/i }));
    const nameInput = await screen.findByLabelText("Name");
    expect(nameInput).toHaveValue("Languages");
    await user.clear(nameInput);
    await user.type(nameInput, "World Languages");
    await user.click(screen.getByRole("button", { name: /update languages/i }));

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith(
        {
          id: "cat-1",
          name: "World Languages",
        },
        expect.anything(),
      );
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    });
  });

  it("updates a category name when the user presses Enter in the name input", async () => {
    const { user } = setup({ totalDecks: 0 });

    await user.click(screen.getByRole("button", { name: /edit languages/i }));
    const nameInput = await screen.findByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "World Languages{Enter}");

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith(
        {
          id: "cat-1",
          name: "World Languages",
        },
        expect.anything(),
      );
    });
  });

  it("shows an error and stays in edit mode when update fails", async () => {
    mockUpdateCategory.mockRejectedValue(new Error("Name already exists"));
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /edit languages/i }));
    await user.click(screen.getByRole("button", { name: /update languages/i }));

    await waitFor(() => {
      expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });
  });

  it("disables the update controls while update is pending", async () => {
    const update = createDeferred<typeof category>();
    mockUpdateCategory.mockReturnValue(update.promise);
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /edit languages/i }));
    await user.click(screen.getByRole("button", { name: /update languages/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /update languages/i }),
      ).toBeDisabled();
    });

    await act(async () => {
      update.resolve(category);
      await update.promise;
    });
  });

  it("enters edit mode and leaves it when the user clicks Cancel", async () => {
    const { user } = setup({ totalDecks: 0 });

    await user.click(screen.getByRole("button", { name: /edit languages/i }));
    await user.click(
      screen.getByRole("button", { name: /cancel editing languages/i }),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    });
  });

  it("deletes a category when the user confirms", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await confirmDelete(user, "Languages");

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith(
        "cat-1",
        expect.anything(),
      );
    });
  });

  it("disables the delete confirmation while deletion is pending", async () => {
    const deletion = createDeferred<void>();
    mockDeleteCategory.mockReturnValue(deletion.promise);
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await user.click(
      await screen.findByRole("button", { name: "Delete Languages" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Delete Languages" }),
      ).toBeDisabled();
    });

    await act(async () => {
      deletion.resolve();
      await deletion.promise;
    });
  });

  it("does not delete a category when the user cancels", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await user.click(
      screen.getByRole("button", { name: /^cancel deleting languages$/i }),
    );

    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });

  it("shows the formatted repository error when deletion fails", async () => {
    mockDeleteCategory.mockRejectedValue(
      new Error(
        "This category has decks. Move or delete those decks before deleting the category.",
      ),
    );
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /delete languages/i }));
    await confirmDelete(user, "Languages");

    await waitFor(() => {
      expect(
        screen.getByText(
          "This category has decks. Move or delete those decks before deleting the category.",
        ),
      ).toBeInTheDocument();
    });
  });
});
