import {
  toCard,
  toCardSchedule,
  type Card,
  type CardSchedule,
} from "@/features/cards/types";
import { formatZodError } from "@/shared/utils/format-zod-error";

const toCardRow = (raw: Record<string, unknown>): unknown => ({
  id: raw.id,
  deckId: raw.deck_id,
  type: raw.type,
  front: raw.front,
  back: raw.back ?? null,
  content: raw.content ?? "{}",
  hint: raw.hint ?? null,
  explanation: raw.explanation ?? null,
  sourceExcerpt: raw.source_excerpt ?? null,
  difficulty: raw.difficulty ?? null,
  tags: raw.tags ?? "[]",
  isSuspended: raw.is_suspended === 1 || raw.is_suspended === true,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

const toScheduleRow = (raw: Record<string, unknown>): unknown => ({
  cardId: raw.card_id,
  state: raw.state,
  dueAt: raw.due_at ?? null,
  intervalDays: raw.interval_days,
  easeFactor: raw.ease_factor,
  repetitionCount: raw.repetition_count,
  lapseCount: raw.lapse_count,
  lastReviewedAt: raw.last_reviewed_at ?? null,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

export const parseCard = (raw: Record<string, unknown>): Card => {
  const result = toCard(toCardRow(raw));
  if (!result.success) {
    throw new Error(`Failed to parse card: ${formatZodError(result.error)}`);
  }
  return result.data;
};

export const parseSchedule = (
  raw: Record<string, unknown>
): CardSchedule => {
  const result = toCardSchedule(toScheduleRow(raw));
  if (!result.success) {
    throw new Error(
      `Failed to parse card schedule: ${formatZodError(result.error)}`
    );
  }
  return result.data;
};
