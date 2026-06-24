import { render, screen } from "@/test-utils";
import { CardWithSchedule } from "@/types/card";
import { describe, expect, it } from "vitest";
import { CardListItemAnswer } from "./card-list-item-answer";

const baseCard: CardWithSchedule = {
  id: "card-1",
  deckId: "deck-1",
  type: "plain",
  front: "What is gravity?",
  back: "A force",
  content: {},
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

describe("CardListItemAnswer", () => {
  it("renders the back text for plain cards", () => {
    render(<CardListItemAnswer card={baseCard} />);
    expect(screen.getByText("A force")).toBeInTheDocument();
  });

  it("renders all multiple choice options and marks the correct one", () => {
    render(
      <CardListItemAnswer
        card={{
          ...baseCard,
          type: "multiple_choice",
          content: {
            choices: [
              { id: "a", text: "Earth" },
              { id: "b", text: "Jupiter" },
            ],
            correctChoiceId: "a",
          },
        }}
      />
    );

    expect(screen.getByLabelText("Answer choices")).toBeInTheDocument();
    expect(screen.getByText("Earth")).toBeInTheDocument();
    expect(screen.getByText("Jupiter")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
  });

  it("renders the accepted answer and alias chips for typed answer cards", () => {
    render(
      <CardListItemAnswer
        card={{
          ...baseCard,
          type: "typed_answer",
          content: {
            acceptedAnswer: "Paris",
            aliases: ["paris", "PARIS"],
          },
        }}
      />
    );

    expect(screen.getByText("Accepted answer")).toBeInTheDocument();
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("Aliases")).toBeInTheDocument();
    expect(screen.getByText("paris")).toBeInTheDocument();
    expect(screen.getByText("PARIS")).toBeInTheDocument();
  });
});
