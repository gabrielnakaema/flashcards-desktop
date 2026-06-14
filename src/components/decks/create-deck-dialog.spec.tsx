import { render, screen, waitFor, within } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreateDeckDialog } from "./create-deck-dialog";

const mockCreateDeck = vi.fn();
const mockCreateCategory = vi.fn();
const mockListCategories = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    createDeck: (...args: unknown[]) => mockCreateDeck(...args),
    createCategory: (...args: unknown[]) => mockCreateCategory(...args),
    listCategories: (...args: unknown[]) => mockListCategories(...args),
    listDeckWithStats: vi.fn().mockResolvedValue([]),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
  },
}));

function setup() {
  const user = userEvent.setup();
  render(<CreateDeckDialog />);
  return { user };
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /create deck/i }));
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  { categoryName = "Science" }: { categoryName?: string } = {}
) {
  await user.type(screen.getByLabelText("Title"), "My Deck");
  await user.click(screen.getByLabelText("Category"));
  await user.type(await screen.findByPlaceholderText(/search/i), categoryName.slice(0, 3));
  await user.click(await screen.findByText(categoryName));
  await user.click(screen.getByRole("button", { name: /^create$/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListCategories.mockResolvedValue([]);
  mockCreateDeck.mockResolvedValue({ id: "deck-1", title: "Test" });
  mockCreateCategory.mockResolvedValue({ id: "cat-1", name: "Science" });
});

describe("CreateDeckDialog", () => {
  describe("trigger", () => {
    it("renders the trigger button", () => {
      setup();
      expect(
        screen.getByRole("button", { name: /create deck/i })
      ).toBeInTheDocument();
    });

    it("opens the dialog when the trigger button is clicked", async () => {
      const { user } = setup();
      await openDialog(user);

      expect(
        screen.getByRole("heading", { name: /create deck/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("form fields", () => {
    it("renders Title, Tags and Category fields with associated labels", async () => {
      const { user } = setup();
      await openDialog(user);

      expect(screen.getByLabelText("Title")).toBeInTheDocument();
      expect(screen.getByLabelText("Tags")).toBeInTheDocument();
      expect(screen.getByLabelText("Category")).toBeInTheDocument();
    });

    it("renders Cancel and Create action buttons", async () => {
      const { user } = setup();
      await openDialog(user);

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
      await openDialog(user);

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        // Both required fields (title, categoryId) must produce visible errors
        expect(within(dialog).getAllByRole("paragraph").length).toBeGreaterThanOrEqual(2);
      });
      expect(mockCreateDeck).not.toHaveBeenCalled();
    });

    it("shows a tags error for a trailing comma", async () => {
      const { user } = setup();
      await openDialog(user);

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
      await openDialog(user);

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
      await openDialog(user);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes the dialog after a successful submission", async () => {
      mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Science" }]);
      const { user } = setup();
      await openDialog(user);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("resets the form when the dialog is reopened after Cancel", async () => {
      const { user } = setup();
      await openDialog(user);

      await user.type(screen.getByLabelText("Title"), "My Deck");
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await openDialog(user);

      expect(screen.getByLabelText("Title")).toHaveValue("");
    });
  });

  describe("submission", () => {
    it("calls createDeck with title, parsed tags and categoryId", async () => {
      mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Science" }]);
      const { user } = setup();
      await openDialog(user);

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
      mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Science" }]);
      const { user } = setup();
      await openDialog(user);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("disables both buttons and shows 'Creating…' while the mutation is pending", async () => {
      mockCreateDeck.mockReturnValue(new Promise(() => {}));
      mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Science" }]);

      const { user } = setup();
      await openDialog(user);

      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /creating/i })
        ).toBeDisabled();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      });
    });
  });

  describe("inline category creation", () => {
    it("creates a new category when the user types a novel name and selects Create", async () => {
      mockListCategories.mockResolvedValue([]);
      const { user } = setup();
      await openDialog(user);

      await user.type(screen.getByLabelText("Title"), "My Deck");
      await user.click(screen.getByLabelText("Category"));
      await user.type(await screen.findByPlaceholderText(/search/i), "Physics");
      await user.click(await screen.findByText(/create "physics"/i));

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Physics" }),
          expect.anything()
        );
      });
    });

    it("does not show the Create option when the query exactly matches an existing category", async () => {
      mockListCategories.mockResolvedValue([{ id: "cat-1", name: "Science" }]);
      const { user } = setup();
      await openDialog(user);

      await user.click(screen.getByLabelText("Category"));
      await user.type(await screen.findByPlaceholderText(/search/i), "Science");

      expect(screen.queryByText(/create "science"/i)).not.toBeInTheDocument();
    });
  });
});
