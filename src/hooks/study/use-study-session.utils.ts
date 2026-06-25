import type { CardWithSchedule, Rating } from "@/types/card";

export interface StudyAnswerResult {
  isRevealed: boolean;
  response?: string;
  selectedChoiceId?: string;
  wasCorrect?: boolean;
}

export interface StudyQueueCounts {
  new: number;
  learning: number;
  review: number;
}

export interface StudySessionStats {
  reviewed: number;
  correct: number;
  again: number;
  nextDueAt: string | null;
}

export const countDueCards = (cards: CardWithSchedule[]): StudyQueueCounts => {
  return cards.reduce<StudyQueueCounts>(
    (counts, card) => {
      const state = card.schedule.state;
      if (state === "new") {
        counts.new += 1;
      } else if (state === "learning" || state === "relearning") {
        counts.learning += 1;
      } else {
        counts.review += 1;
      }
      return counts;
    },
    { new: 0, learning: 0, review: 0 }
  );
};

export const getSoonestDueAt = (
  current: string | null,
  next: string | null
): string | null => {
  if (!next) return current;
  if (!current) return next;
  return new Date(next).getTime() < new Date(current).getTime()
    ? next
    : current;
};

export const getUpdatedStats = (
  currentStats: StudySessionStats,
  rating: Rating,
  answerResult: StudyAnswerResult,
  nextDueAt: string | null
): StudySessionStats => ({
  reviewed: currentStats.reviewed + 1,
  correct:
    answerResult.wasCorrect === true
      ? currentStats.correct + 1
      : currentStats.correct,
  again: rating === "again" ? currentStats.again + 1 : currentStats.again,
  nextDueAt: getSoonestDueAt(currentStats.nextDueAt, nextDueAt),
});
