import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, selectComboboxOption, waitFor } from "@/test-utils";
import type { Card } from "@/features/cards/types";
import { CardForm } from "./card-form";
import { ComponentProps } from "react";

const mockCreateCard = vi.fn();
const mockUpdateCard = vi.fn();

vi.mock("@/data/repositories", () => ({
  deckRepository: {},
  cardRepository: {
    createCard: (...args: unknown[]) => mockCreateCard(...args),
    updateCard: (...args: unknown[]) => mockUpdateCard(...args),
    listCardsByDeck: vi.fn().mockResolvedValue([]),
  },
}));

const DECK_ID = "deck-1";

const makePlainCard = (overrides: Partial<Card> = {}): Card => ({
  id: "card-1",
  deckId: DECK_ID,
  type: "plain",
  front: "What is gravity?",
  back: "A force",
  content: {} as any,
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: [],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

function setup(props: Partial<ComponentProps<typeof CardForm>> = {}) {
  const user = userEvent.setup();
  const onSuccess = props.onSuccess ?? vi.fn();

  render(<CardForm deckId={DECK_ID} onSuccess={onSuccess} {...props} />);

  return { user, onSuccess };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateCard.mockResolvedValue(makePlainCard());
  mockUpdateCard.mockResolvedValue(makePlainCard());
});

describe("CardForm", () => {
  describe("create mode", () => {
    it("shows 'Create flashcard' heading and 'Create' submit button", () => {
      setup();
      expect(screen.getByText("Create flashcard")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^create$/i })
      ).toBeInTheDocument();
    });

    it("renders Front, Hint, Explanation, Source excerpt, and Tags fields", () => {
      setup();
      expect(screen.getByLabelText("Front")).toBeInTheDocument();
      expect(screen.getByLabelText("Hint")).toBeInTheDocument();
      expect(screen.getByLabelText("Explanation")).toBeInTheDocument();
      expect(screen.getByLabelText("Source excerpt")).toBeInTheDocument();
      expect(screen.getByLabelText("Tags")).toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("shows 'Edit flashcard' heading and 'Save' submit button", () => {
      setup({ card: makePlainCard() });
      expect(screen.getByText("Edit flashcard")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^save$/i })
      ).toBeInTheDocument();
    });

    it("pre-fills front and back with the card values", () => {
      setup({
        card: makePlainCard({ front: "What is gravity?", back: "A force" }),
      });
      expect(screen.getByLabelText("Front")).toHaveValue("What is gravity?");
      expect(screen.getByLabelText("Back")).toHaveValue("A force");
    });

    it("disables the type select in edit mode", () => {
      setup({ card: makePlainCard() });
      expect(screen.getByRole("combobox", { name: /type/i })).toBeDisabled();
    });
  });

  describe("field visibility by card type", () => {
    it("shows the Back field for plain type", () => {
      setup();
      expect(screen.getByLabelText("Back")).toBeInTheDocument();
    });

    it("hides the Back field when type is switched to multiple_choice", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Multiple choice"
      );

      expect(screen.queryByLabelText("Back")).not.toBeInTheDocument();
    });

    it("shows Choices section and Correct choice select for multiple_choice type", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Multiple choice"
      );

      expect(screen.getByText("Choices")).toBeInTheDocument();
      expect(screen.getByLabelText("Correct choice")).toBeInTheDocument();
    });

    it("shows Accepted answer, Aliases and Case sensitive for typed_answer type", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Typed answer"
      );

      expect(screen.getByLabelText("Accepted answer")).toBeInTheDocument();
      expect(screen.getByLabelText("Aliases")).toBeInTheDocument();
      expect(screen.getByLabelText(/case sensitive/i)).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows 'Front is required' error when front is blank", async () => {
      const { user } = setup();

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText("Front is required")).toBeInTheDocument();
      });
      expect(mockCreateCard).not.toHaveBeenCalled();
    });

    it("shows 'Back is required for plain cards' when back is blank", async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText("Front"), "Some question");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Back is required for plain cards")
        ).toBeInTheDocument();
      });
      expect(mockCreateCard).not.toHaveBeenCalled();
    });

    it("shows 'Select the correct choice' error when no correct choice is picked", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Multiple choice"
      );

      await user.type(screen.getByLabelText("Front"), "Largest planet?");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/select the correct choice/i)
        ).toBeInTheDocument();
      });
      expect(mockCreateCard).not.toHaveBeenCalled();
    });

    it("shows 'Accepted answer is required' when blank for typed_answer", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Typed answer"
      );

      await user.type(screen.getByLabelText("Front"), "Capital of France?");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Accepted answer is required")
        ).toBeInTheDocument();
      });
      expect(mockCreateCard).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls createCard and calls onSuccess after successful creation", async () => {
      const onSuccess = vi.fn();
      const { user } = setup({ onSuccess });

      await user.type(screen.getByLabelText("Front"), "What is gravity?");
      await user.type(screen.getByLabelText("Back"), "A force");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(mockCreateCard).toHaveBeenCalledWith(
          expect.objectContaining({
            deckId: DECK_ID,
            type: "plain",
            front: "What is gravity?",
            back: "A force",
          }),
          expect.anything()
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("resets the form to defaults after successful creation", async () => {
      const { user } = setup();

      await user.type(screen.getByLabelText("Front"), "What is gravity?");
      await user.type(screen.getByLabelText("Back"), "A force");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => expect(mockCreateCard).toHaveBeenCalledTimes(1));

      expect(screen.getByLabelText("Front")).toHaveValue("");
    });

    it("calls createCard with content payload for multiple_choice type", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Multiple choice"
      );

      await user.type(screen.getByLabelText("Front"), "Largest planet?");
      await user.type(screen.getByPlaceholderText("Choice 1"), "Earth");
      await user.type(screen.getByPlaceholderText("Choice 2"), "Jupiter");

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /correct choice/i }),
        /^A:/i
      );

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(mockCreateCard).toHaveBeenCalledWith(
          expect.objectContaining({
            deckId: DECK_ID,
            type: "multiple_choice",
            front: "Largest planet?",
            content: expect.objectContaining({
              choices: expect.arrayContaining([
                expect.objectContaining({ id: "a", text: "Earth" }),
                expect.objectContaining({ id: "b", text: "Jupiter" }),
              ]),
              correctChoiceId: "a",
            }),
          }),
          expect.anything()
        );
        expect(mockCreateCard.mock.calls[0][0]).not.toHaveProperty("back");
      });
    });

    it("calls createCard with content payload for typed_answer type", async () => {
      const { user } = setup();

      await selectComboboxOption(
        user,
        screen.getByRole("combobox", { name: /type/i }),
        "Typed answer"
      );

      await user.type(screen.getByLabelText("Front"), "Capital of France?");
      await user.type(screen.getByLabelText("Accepted answer"), "Paris");
      await user.type(screen.getByLabelText("Aliases"), "paris, PARIS");

      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(mockCreateCard).toHaveBeenCalledWith(
          expect.objectContaining({
            deckId: DECK_ID,
            type: "typed_answer",
            front: "Capital of France?",
            content: expect.objectContaining({
              acceptedAnswer: "Paris",
              aliases: ["paris", "PARIS"],
              caseSensitive: false,
            }),
          }),
          expect.anything()
        );
        expect(mockCreateCard.mock.calls[0][0]).not.toHaveProperty("back");
      });
    });

    it("calls updateCard in edit mode and calls onSuccess", async () => {
      const card = makePlainCard({ front: "Old front", back: "Old back" });
      const onSuccess = vi.fn();
      const { user } = setup({ card, onSuccess });

      await user.clear(screen.getByLabelText("Front"));
      await user.type(screen.getByLabelText("Front"), "New front");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() => {
        expect(mockUpdateCard).toHaveBeenCalledWith(
          expect.objectContaining({
            id: card.id,
            front: "New front",
          }),
          expect.anything()
        );
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("shows root error message when the mutation rejects", async () => {
      mockCreateCard.mockRejectedValue(new Error("Server error"));
      const { user } = setup();

      await user.type(screen.getByLabelText("Front"), "What is gravity?");
      await user.type(screen.getByLabelText("Back"), "A force");
      await user.click(screen.getByRole("button", { name: /^create$/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(/server error/i);
      });
    });
  });
});
