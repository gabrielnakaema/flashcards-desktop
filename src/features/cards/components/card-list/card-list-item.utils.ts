import type { CardSchedule, CardType } from "@/features/cards/types";

export const cardDifficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

export const cardStateLabels = {
  new: "New",
  learning: "Learning",
  review: "Review",
  relearning: "Relearning",
} as const;

export const cardTypeLabels: Record<CardType, string> = {
  plain: "Plain",
  multiple_choice: "Multiple choice",
  typed_answer: "Typed answer",
};

export const formatDateTime = (value: string | null): string => {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatInterval = (days: number): string => {
  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  return `${days} days`;
};

export const formatScheduleSummary = (schedule: CardSchedule): string => {
  return `Due ${formatDateTime(schedule.dueAt)} · ${formatInterval(schedule.intervalDays)} interval`;
};
