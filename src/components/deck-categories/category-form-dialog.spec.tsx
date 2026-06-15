import { render, screen, waitFor, within } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckCategory } from "@/types/deck";
import { CategoryFormDialog } from "./category-form-dialog";

const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
    listCategories: vi.fn().mockResolvedValue([]),
    listDeckWithStats: vi.fn().mockResolvedValue([]),
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

function ControlledDialog(
  props: Partial<ComponentProps<typeof CategoryFormDialog>> = {}
) {
  const [open, setOpen] = useState(true);

  return (
    <CategoryFormDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      {...props}
    />
  );
}

function setup(props: Partial<ComponentProps<typeof CategoryFormDialog>> = {}) {
  const user = userEvent.setup();

  render(
    props.open === undefined ? (
      <ControlledDialog {...props} />
    ) : (
      <CategoryFormDialog
        mode="create"
        open
        onOpenChange={vi.fn()}
        {...props}
      />
    )
  );

  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateCategory.mockResolvedValue({ id: "cat-1", name: "Languages" });
  mockUpdateCategory.mockResolvedValue({
    id: "cat-1",
    name: "World Languages",
  });
});

describe("CategoryFormDialog", () => {
  describe("create mode", () => {
    it("renders the create dialog with a name field and action buttons", () => {
      setup();

      expect(
        screen.getByRole("heading", { name: /create category/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^create$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("does not submit when the name is empty", async () => {
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(
          within(dialog).getByText(/name is required/i)
        ).toBeInTheDocument();
      });
      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it("calls createCategory and closes the dialog on submit", async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText("Name"), "Languages");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          { name: "Languages" },
          expect.anything()
        );
      });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes the dialog when Cancel is clicked", async () => {
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("edit mode", () => {
    it("prefills the category name and saves changes", async () => {
      const { user } = setup({
        mode: "edit",
        category: { id: "cat-1", name: "Languages" },
      });

      expect(screen.getByLabelText("Name")).toHaveValue("Languages");

      await user.clear(screen.getByLabelText("Name"));
      await user.type(screen.getByLabelText("Name"), "World Languages");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => {
        expect(mockUpdateCategory).toHaveBeenCalledWith(
          { id: "cat-1", name: "World Languages" },
          expect.anything()
        );
      });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("resets the form to the new category when switching between categories", async () => {
      const cat1: DeckCategory = { id: "cat-1", name: "Languages" };
      const cat2: DeckCategory = { id: "cat-2", name: "Science" };

      function SwitchableCategoryDialog() {
        const [open, setOpen] = useState(false);
        const [category, setCategory] = useState<DeckCategory | undefined>();

        return (
          <>
            <button
              onClick={() => {
                setCategory(cat1);
                setOpen(true);
              }}
            >
              Edit Category 1
            </button>
            <button
              onClick={() => {
                setCategory(cat2);
                setOpen(true);
              }}
            >
              Edit Category 2
            </button>
            <CategoryFormDialog
              mode="edit"
              category={category}
              open={open}
              onOpenChange={setOpen}
            />
          </>
        );
      }

      const user = userEvent.setup();
      render(<SwitchableCategoryDialog />);

      await user.click(
        screen.getByRole("button", { name: /edit category 1/i })
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Languages");

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /edit category 2/i })
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Science");
    });
  });
});
