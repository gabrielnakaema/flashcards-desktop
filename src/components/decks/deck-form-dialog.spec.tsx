import { render, screen, waitFor, within } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckWithStats } from "@/types/deck";
import { DeckFormDialog } from "./deck-form-dialog";

const mockCreateDeck = vi.fn();
const mockCreateCategory = vi.fn();
const mockListCategories = vi.fn();
const mockUpdateDeck = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    createDeck: (...args: unknown[]) => mockCreateDeck(...args),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    listCategories: (...args: unknown[]) => mockListCategories(...args),
    updateDeck: (...args: unknown[]) => mockUpdateDeck(...args),
    listDeckWithStats: vi.fn().mockResolvedValue([]),
    deleteDeck: vi.fn(),
    deleteCategory: vi.fn(),
    updateCategory: vi.fn(),
  },
}));

function ControlledDialog(
  props: Partial<ComponentProps<typeof DeckFormDialog>> = {}
) {
  const [open, setOpen] = useState(true);

  return (
    <DeckFormDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      {...props}
    />
  );
}

function setup(props: Partial<ComponentProps<typeof DeckFormDialog>> = {}) {
  const user = userEvent.setup();

  render(
    props.open === undefined ? (
      <ControlledDialog {...props} />
    ) : (
      <DeckFormDialog mode="create" open onOpenChange={vi.fn()} {...props} />
    )
  );

  return { user };
}

const defaultDeck: DeckWithStats = {
  id: "deck-1",
  title: "My Deck",
  tags: ["math", "science"],
  category: { id: "cat-1", name: "Science" },
  cardsDue: 0,
  masteryPercentage: 0,
  totalCards: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockListCategories.mockResolvedValue([]);
  mockCreateDeck.mockResolvedValue({ id: "deck-1", title: "My Deck" });
  mockCreateCategory.mockResolvedValue({ id: "cat-1", name: "Science" });
  mockUpdateDeck.mockResolvedValue(defaultDeck);
});

describe("DeckFormDialog", () => {
  describe("create mode", () => {
    describe("form fields", () => {
      it("renders Title, Tags and Category fields with associated labels", () => {
        setup();

        expect(screen.getByLabelText("Title")).toBeInTheDocument();
        expect(screen.getByLabelText("Tags")).toBeInTheDocument();
        expect(screen.getByLabelText("Category")).toBeInTheDocument();
      });

      it("renders Cancel and Create action buttons", () => {
        setup();

        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /^create$/i })
        ).toBeInTheDocument();
      });
    });

    describe("validation", () => {
      it("does not submit and shows errors when Title and Category are empty", async () => {
        const { user } = setup();

        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          const dialog = screen.getByRole("dialog");
          expect(
            within(dialog).getAllByRole("paragraph").length
          ).toBeGreaterThanOrEqual(2);
        });
        expect(mockCreateDeck).not.toHaveBeenCalled();
      });

      it("shows a tags error for a trailing comma", async () => {
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.type(screen.getByLabelText("Tags"), "math,");
        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          expect(
            screen.getByText(/tag at position \d+ is empty/i)
          ).toBeInTheDocument();
        });
        expect(mockCreateDeck).not.toHaveBeenCalled();
      });

      it("shows a tags error for consecutive commas", async () => {
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.type(screen.getByLabelText("Tags"), "math,,science");
        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          expect(
            screen.getByText(/tag at position \d+ is empty/i)
          ).toBeInTheDocument();
        });
        expect(mockCreateDeck).not.toHaveBeenCalled();
      });
    });

    describe("dialog lifecycle", () => {
      it("closes the dialog when Cancel is clicked", async () => {
        const { user } = setup();

        await user.click(screen.getByRole("button", { name: /cancel/i }));

        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
      });

      it("closes the dialog after a successful submission", async () => {
        mockListCategories.mockResolvedValue([
          { id: "cat-1", name: "Science" },
        ]);
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.click(screen.getByLabelText("Category"));
        await user.type(await screen.findByPlaceholderText(/search/i), "Sci");
        await user.click(await screen.findByText("Science"));
        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
      });

      it("resets the form when the dialog is reopened after Cancel", async () => {
        function ReopenableDialog() {
          const [open, setOpen] = useState(false);
          return (
            <>
              <button onClick={() => setOpen(true)}>Open dialog</button>
              <DeckFormDialog
                mode="create"
                open={open}
                onOpenChange={setOpen}
              />
            </>
          );
        }

        const user = userEvent.setup();
        render(<ReopenableDialog />);

        await user.click(screen.getByRole("button", { name: /open dialog/i }));
        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.click(screen.getByRole("button", { name: /cancel/i }));
        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        );

        await user.click(screen.getByRole("button", { name: /open dialog/i }));

        expect(screen.getByLabelText("Title")).toHaveValue("");
      });
    });

    describe("submission", () => {
      it("calls createDeck with title, parsed tags and categoryId", async () => {
        mockListCategories.mockResolvedValue([
          { id: "cat-1", name: "Science" },
        ]);
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.type(screen.getByLabelText("Tags"), "math, science");
        await user.click(screen.getByLabelText("Category"));
        await user.type(await screen.findByPlaceholderText(/search/i), "Sci");
        await user.click(await screen.findByText("Science"));
        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          expect(mockCreateDeck).toHaveBeenCalledWith(
            expect.objectContaining({
              title: "My Deck",
              tags: ["math", "science"],
              categoryId: "cat-1",
            }),
            expect.anything()
          );
        });
      });

      it("displays a mutation error message when createDeck rejects", async () => {
        mockCreateDeck.mockRejectedValue(new Error("Network error"));
        mockListCategories.mockResolvedValue([
          { id: "cat-1", name: "Science" },
        ]);
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.click(screen.getByLabelText("Category"));
        await user.type(await screen.findByPlaceholderText(/search/i), "Sci");
        await user.click(await screen.findByText("Science"));
        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          expect(screen.getByText(/network error/i)).toBeInTheDocument();
        });
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      it("disables both action buttons while the mutation is pending", async () => {
        mockCreateDeck.mockReturnValue(new Promise(() => {}));
        mockListCategories.mockResolvedValue([
          { id: "cat-1", name: "Science" },
        ]);
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.click(screen.getByLabelText("Category"));
        await user.type(await screen.findByPlaceholderText(/search/i), "Sci");
        await user.click(await screen.findByText("Science"));
        await user.click(screen.getByRole("button", { name: /^create$/i }));

        await waitFor(() => {
          expect(
            screen.getByRole("button", { name: /cancel/i })
          ).toBeDisabled();
          const submitButton = document.querySelector(
            "button[type='submit']"
          ) as HTMLButtonElement;
          expect(submitButton).toBeDisabled();
        });
      });
    });

    describe("inline category creation", () => {
      it("creates a new category when the user types a novel name and selects Create", async () => {
        const { user } = setup();

        await user.type(screen.getByLabelText("Title"), "My Deck");
        await user.click(screen.getByLabelText("Category"));
        await user.type(
          await screen.findByPlaceholderText(/search/i),
          "Physics"
        );
        await user.click(await screen.findByText(/create "physics"/i));

        await waitFor(() => {
          expect(mockCreateCategory).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Physics" }),
            expect.anything()
          );
        });
      });

      it("does not show the Create option when the query exactly matches an existing category", async () => {
        mockListCategories.mockResolvedValue([
          { id: "cat-1", name: "Science" },
        ]);
        const { user } = setup();

        await user.click(screen.getByLabelText("Category"));
        await user.type(
          await screen.findByPlaceholderText(/search/i),
          "Science"
        );

        expect(screen.queryByText(/create "science"/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("edit mode", () => {
    it("prefills the title and tags fields with deck values", () => {
      setup({ mode: "edit", deck: defaultDeck });

      expect(screen.getByLabelText("Title")).toHaveValue("My Deck");
      expect(screen.getByLabelText("Tags")).toHaveValue("math, science");
    });

    it("renders Save and Cancel action buttons", () => {
      setup({ mode: "edit", deck: defaultDeck });

      expect(
        screen.getByRole("button", { name: /^save$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("calls updateDeck with updated values and closes on save", async () => {
      mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Science" }]);
      const { user } = setup({ mode: "edit", deck: defaultDeck });

      await user.clear(screen.getByLabelText("Title"));
      await user.type(screen.getByLabelText("Title"), "Updated Deck");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => {
        expect(mockUpdateDeck).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "deck-1",
            title: "Updated Deck",
            tags: ["math", "science"],
            categoryId: "cat-1",
          }),
          expect.anything()
        );
      });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("resets to the new deck when switching between decks", async () => {
      const deck2: DeckWithStats = {
        id: "deck-2",
        title: "Another Deck",
        tags: ["history"],
        category: { id: "cat-2", name: "History" },
        cardsDue: 0,
        masteryPercentage: 0,
        totalCards: 3,
      };

      function SwitchableDeckDialog() {
        const [open, setOpen] = useState(false);
        const [deck, setDeck] = useState<DeckWithStats | undefined>();

        return (
          <>
            <button
              onClick={() => {
                setDeck(defaultDeck);
                setOpen(true);
              }}
            >
              Edit Deck 1
            </button>
            <button
              onClick={() => {
                setDeck(deck2);
                setOpen(true);
              }}
            >
              Edit Deck 2
            </button>
            <DeckFormDialog
              mode="edit"
              deck={deck}
              open={open}
              onOpenChange={setOpen}
            />
          </>
        );
      }

      const user = userEvent.setup();
      render(<SwitchableDeckDialog />);

      await user.click(screen.getByRole("button", { name: /edit deck 1/i }));
      expect(screen.getByLabelText("Title")).toHaveValue("My Deck");

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );

      await user.click(screen.getByRole("button", { name: /edit deck 2/i }));
      expect(screen.getByLabelText("Title")).toHaveValue("Another Deck");
    });
  });
});
