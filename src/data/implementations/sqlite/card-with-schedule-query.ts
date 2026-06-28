import type { CardWithSchedule } from "@/features/cards/types";
import { parseCard, parseSchedule } from "./card-sqlite-mappers";

export const CARD_WITH_SCHEDULE_SELECT = `
  SELECT
    c.*,
    cs.card_id, cs.state, cs.due_at, cs.interval_days,
    cs.ease_factor, cs.repetition_count, cs.lapse_count,
    cs.last_reviewed_at,
    cs.created_at AS cs_created_at,
    cs.updated_at AS cs_updated_at
  FROM cards c
  JOIN card_schedules cs ON c.id = cs.card_id`;

export const rowToCardWithSchedule = (
  row: Record<string, unknown>
): CardWithSchedule => {
  const card = parseCard(row);
  const schedule = parseSchedule({
    card_id: row.card_id,
    state: row.state,
    due_at: row.due_at,
    interval_days: row.interval_days,
    ease_factor: row.ease_factor,
    repetition_count: row.repetition_count,
    lapse_count: row.lapse_count,
    last_reviewed_at: row.last_reviewed_at,
    created_at: row.cs_created_at,
    updated_at: row.cs_updated_at,
  });
  return { ...card, schedule };
};
