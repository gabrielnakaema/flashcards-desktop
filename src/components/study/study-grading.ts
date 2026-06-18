import type { Card } from "@/types/card";

export interface TypedAnswerGrade {
  isCorrect: boolean;
  acceptedAnswers: string[];
}

export const normalizeTypedAnswer = (
  value: string,
  caseSensitive = false
): string => {
  const normalized = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? normalized : normalized.toLocaleLowerCase();
};

export const gradeTypedAnswer = (
  card: Extract<Card, { type: "typed_answer" }>,
  response: string
): TypedAnswerGrade => {
  const acceptedAnswers = [
    card.content.acceptedAnswer,
    ...(card.content.aliases ?? []),
  ].filter((answer) => answer.trim().length > 0);
  const normalizedResponse = normalizeTypedAnswer(
    response,
    card.content.caseSensitive
  );

  return {
    acceptedAnswers,
    isCorrect: acceptedAnswers.some(
      (answer) =>
        normalizeTypedAnswer(answer, card.content.caseSensitive) ===
        normalizedResponse
    ),
  };
};

export const isCorrectChoice = (
  card: Extract<Card, { type: "multiple_choice" }>,
  choiceId: string
): boolean => {
  return card.content.correctChoiceId === choiceId;
};

export const getChoiceText = (
  card: Extract<Card, { type: "multiple_choice" }>,
  choiceId: string
): string | undefined => {
  return card.content.choices.find((choice) => choice.id === choiceId)?.text;
};
