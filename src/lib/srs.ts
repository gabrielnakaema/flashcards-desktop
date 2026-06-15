import type { CardState, Rating } from "@/types/card";

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const LEARNING_STEP_MINUTES = 10;

export interface CardScheduleInput {
  state: CardState;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  lapseCount: number;
}

export interface ScheduleUpdate {
  state: CardState;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  lapseCount: number;
  lastReviewedAt: string;
}

// Super Memo 2 Algorithm
// https://super-memory.com/english/ol/sm2.htm
export const computeNextSchedule = (
  current: CardScheduleInput,
  rating: Rating,
  reviewedAt: Date = new Date()
): ScheduleUpdate => {
  const { state, intervalDays, easeFactor, repetitionCount, lapseCount } =
    current;

  const base: Pick<ScheduleUpdate, "lastReviewedAt"> = {
    lastReviewedAt: toIso(reviewedAt),
  };

  if (state === "new" || state === "learning") {
    if (rating === "again" || rating === "hard") {
      return {
        ...base,
        state: "learning",
        dueAt: toIso(addMinutes(reviewedAt, LEARNING_STEP_MINUTES)),
        intervalDays: 0,
        easeFactor,
        repetitionCount,
        lapseCount,
      };
    }
    if (rating === "good") {
      return {
        ...base,
        state: "review",
        dueAt: toIso(addDays(reviewedAt, 1)),
        intervalDays: 1,
        easeFactor,
        repetitionCount: repetitionCount + 1,
        lapseCount,
      };
    }

    // rating === "easy"

    return {
      ...base,
      state: "review",
      dueAt: toIso(addDays(reviewedAt, 4)),
      intervalDays: 4,
      easeFactor,
      repetitionCount: repetitionCount + 1,
      lapseCount,
    };
  }

  if (state === "relearning") {
    if (rating === "again") {
      return {
        ...base,
        state: "relearning",
        dueAt: toIso(addMinutes(reviewedAt, LEARNING_STEP_MINUTES)),
        intervalDays: 1,
        easeFactor,
        repetitionCount,
        lapseCount: lapseCount + 1,
      };
    }

    return {
      ...base,
      state: "review",
      dueAt: toIso(addDays(reviewedAt, 1)),
      intervalDays: 1,
      easeFactor,
      repetitionCount: repetitionCount + 1,
      lapseCount,
    };
  }

  if (rating === "again") {
    return {
      ...base,
      state: "relearning",
      dueAt: toIso(addMinutes(reviewedAt, LEARNING_STEP_MINUTES)),
      intervalDays: 1,
      easeFactor: clampEase(easeFactor - 0.2),
      repetitionCount,
      lapseCount: lapseCount + 1,
    };
  }

  if (rating === "hard") {
    const newInterval = Math.max(1, Math.round(intervalDays * 1.2));
    return {
      ...base,
      state: "review",
      dueAt: toIso(addDays(reviewedAt, newInterval)),
      intervalDays: newInterval,
      easeFactor: clampEase(easeFactor - 0.15),
      repetitionCount: repetitionCount + 1,
      lapseCount,
    };
  }

  if (rating === "good") {
    const newInterval = Math.max(1, Math.round(intervalDays * easeFactor));
    return {
      ...base,
      state: "review",
      dueAt: toIso(addDays(reviewedAt, newInterval)),
      intervalDays: newInterval,
      easeFactor,
      repetitionCount: repetitionCount + 1,
      lapseCount,
    };
  }

  const newInterval = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));

  return {
    ...base,
    state: "review",
    dueAt: toIso(addDays(reviewedAt, newInterval)),
    intervalDays: newInterval,
    easeFactor: easeFactor + 0.15,
    repetitionCount: repetitionCount + 1,
    lapseCount,
  };
};

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const toIso = (date: Date): string => {
  return date.toISOString();
};

const clampEase = (ease: number): number => {
  return Math.max(MIN_EASE_FACTOR, ease);
};

export { DEFAULT_EASE_FACTOR };
