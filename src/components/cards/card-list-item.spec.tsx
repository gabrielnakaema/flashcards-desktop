import { render, screen } from "@/test-utils";
import { CardWithSchedule } from "@/types/card";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { CardListItem } from "./card-list-item";

const card: CardWithSchedule = {
  id: "card-1",
  deckId: "deck-1",
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
  schedule: {
    cardId: "card-1",
    state: "review",
    dueAt: "2024-01-02T15:00:00.000Z",
    intervalDays: 3,
    easeFactor: 2.35,
    repetitionCount: 4,
    lapseCount: 1,
    lastReviewedAt: "2024-01-01T15:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
};

function setup(props: Partial<ComponentProps<typeof CardListItem>> = {}) {
  const user = userEvent.setup();
  const onEdit = props.onEdit ?? vi.fn();
  const onDelete = props.onDelete ?? vi.fn();
  render(
    <CardListItem card={card} onEdit={onEdit} onDelete={onDelete} {...props} />
  );

  return { user, onEdit };
}

describe("CardListItem", () => {
  it("renders the card list item", () => {
    setup();
    expect(screen.getByText("What is gravity?")).toBeInTheDocument();
  });

  it("renders the card difficulty if present", () => {
    setup({ card: { ...card, difficulty: "easy" } });
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("renders the card tags if present", () => {
    setup({ card: { ...card, tags: ["tag1", "tag2"] } });
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
  });

  it("renders SRS schedule details below the card data", () => {
    setup();
    expect(screen.getByText(/due/i)).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Interval: 3 days")).toBeInTheDocument();
    expect(screen.getByText(/last reviewed/i)).toBeInTheDocument();
  });

  it("renders card back if card.type is plain", () => {
    setup({ card: { ...card, type: "plain" } });
    expect(screen.getByText("A force")).toBeInTheDocument();
  });

  it("does not render card back if card.type is not plain", () => {
    setup({
      card: {
        ...card,
        back: "Specific back text",
        type: "multiple_choice",
        content: {
          choices: [
            { id: "a", text: "Earth" },
            { id: "b", text: "Jupiter" },
          ],
          correctChoiceId: "a",
        },
      },
    });
    expect(screen.queryByText("Specific back text")).not.toBeInTheDocument();

    setup({
      card: {
        ...card,
        back: "Specific back text",
        type: "typed_answer",
        content: {
          acceptedAnswer: "Paris",
          aliases: ["paris", "PARIS"],
          caseSensitive: false,
        },
      },
    });
    expect(screen.queryByText("Specific back text")).not.toBeInTheDocument();
  });

  it("renders card choices if card.type is multiple_choice", () => {
    setup({
      card: {
        ...card,
        type: "multiple_choice",
        content: {
          choices: [
            { id: "a", text: "Earth" },
            { id: "b", text: "Jupiter" },
          ],
          correctChoiceId: "a",
        },
      },
    });
    expect(screen.getByText("Earth")).toBeInTheDocument();
    expect(screen.getByText("Jupiter")).toBeInTheDocument();
  });

  it("renders card accepted answer if card.type is typed_answer", () => {
    setup({
      card: {
        ...card,
        type: "typed_answer",
        content: { acceptedAnswer: "Paris" },
      },
    });
    expect(screen.getByText("Paris")).toBeInTheDocument();
  });

  it("renders card aliases if card.type is typed_answer", () => {
    setup({
      card: {
        ...card,
        type: "typed_answer",
        content: { acceptedAnswer: "Paris", aliases: ["paris", "PARIS"] },
      },
    });

    expect(
      screen.getByText("paris, PARIS", {
        exact: false,
      })
    ).toBeInTheDocument();
  });

  it("calls onEdit when the edit button is clicked", async () => {
    const onEdit = vi.fn();
    const { user } = setup({ onEdit });
    const editButton = screen.getByRole("button", { name: /edit/i });

    await user.click(editButton);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when the delete button is clicked", async () => {
    const onDelete = vi.fn();
    const { user } = setup({ onDelete });
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
