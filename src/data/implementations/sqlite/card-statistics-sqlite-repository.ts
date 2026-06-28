import type {
  CardStatisticsRepository,
  CardStats,
  Streak,
} from "@/features/cards/card-statistics-repository";
import { getDb } from "./db";
import type { SqlClient } from "./sql-client";

const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const getWeekRange = (inputDate: Date): { start: Date; end: Date } => {
  const date = new Date(inputDate);
  const mondayIndex = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(start.getDate() - mondayIndex);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setDate(end.getDate() + (6 - mondayIndex));
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export class CardStatisticsSqliteRepository
  implements CardStatisticsRepository
{
  constructor(private readonly db?: SqlClient) {}

  private get dbClient(): SqlClient {
    return this.db ?? getDb();
  }

  getStats = async (date: Date): Promise<CardStats> => {
    const endOfDay = getEndOfDay(date).toISOString();
    const startOfDay = getStartOfDay(date).toISOString();
    const { start: startOfWeek, end: endOfWeek } = getWeekRange(date);

    const [row] = await this.dbClient.select<
      {
        cardsDueNow: number;
        cardsReviewedToday: number;
        totalCardsInDecks: number;
        totalCardsReviewedThisWeek: number;
        deckIdWithMostCardsDue: string;
        mostCardsDueInDeck: number;
        deckCount: number;
        nextDueAt: string | null;
      }[]
    >(
      `WITH
        p(end_of_day, start_of_day, start_of_week, end_of_week) AS (
          SELECT $1, $2, $3, $4
        ),
        due_by_deck AS (
          SELECT c.deck_id, COUNT(*) AS n
          FROM card_schedules cs
          JOIN cards c ON cs.card_id = c.id
          WHERE cs.due_at IS NOT NULL
            AND datetime(cs.due_at) <= datetime((SELECT end_of_day FROM p))
          GROUP BY c.deck_id
        )
      SELECT
        COALESCE((SELECT COUNT(*) FROM card_schedules
                  WHERE due_at IS NOT NULL
                    AND datetime(due_at) <= datetime((SELECT end_of_day FROM p))), 0)     AS cardsDueNow,
        COALESCE((SELECT COUNT(*) FROM review_logs
                  WHERE datetime(reviewed_at) >= datetime((SELECT start_of_day FROM p))
                    AND datetime(reviewed_at) <= datetime((SELECT end_of_day FROM p))), 0) AS cardsReviewedToday,
        (SELECT COUNT(*) FROM cards)                                                       AS totalCardsInDecks,
        COALESCE((SELECT COUNT(*) FROM review_logs
                  WHERE datetime(reviewed_at) >= datetime((SELECT start_of_week FROM p))
                    AND datetime(reviewed_at) <= datetime((SELECT end_of_week FROM p))), 0) AS totalCardsReviewedThisWeek,
        COALESCE((SELECT deck_id FROM due_by_deck ORDER BY n DESC LIMIT 1), '')            AS deckIdWithMostCardsDue,
        COALESCE((SELECT n FROM due_by_deck ORDER BY n DESC LIMIT 1), 0)                   AS mostCardsDueInDeck,
        (SELECT COUNT(*) FROM decks)                                                       AS deckCount,
        (SELECT MIN(datetime(due_at)) FROM card_schedules
         WHERE due_at IS NOT NULL)                                                         AS nextDueAt`,
      [
        endOfDay,
        startOfDay,
        startOfWeek.toISOString(),
        endOfWeek.toISOString(),
      ]
    );

    return {
      cardsDueNow: row.cardsDueNow,
      cardsReviewedToday: row.cardsReviewedToday,
      totalCardsInDecks: row.totalCardsInDecks,
      totalCardsReviewedThisWeek: row.totalCardsReviewedThisWeek,
      deckIdWithMostCardsDue: row.deckIdWithMostCardsDue,
      mostCardsDueInDeck: row.mostCardsDueInDeck,
      deckCount: row.deckCount,
      nextDueAt: row.nextDueAt,
    };
  };

  getStreak = async (): Promise<Streak> => {
    const [row] = await this.dbClient.select<
      { currentStreak: number; bestStreak: number }[]
    >(
      `WITH
        daily_reviews AS (
          SELECT date(reviewed_at) AS review_date
          FROM review_logs
          GROUP BY date(reviewed_at)
        ),
        numbered AS (
          SELECT review_date,
                 ROW_NUMBER() OVER (ORDER BY review_date ASC) - 1 AS rn
          FROM daily_reviews
        ),
        streak_groups AS (
          SELECT review_date,
                 date(review_date, '-' || CAST(rn AS INTEGER) || ' days') AS grp
          FROM numbered
        ),
        group_counts AS (
          SELECT grp, COUNT(*) AS streak_len, MAX(review_date) AS last_day
          FROM streak_groups
          GROUP BY grp
        )
      SELECT
        COALESCE((SELECT streak_len FROM group_counts
                  WHERE last_day >= date('now', '-1 day')
                  ORDER BY last_day DESC LIMIT 1), 0) AS currentStreak,
        COALESCE((SELECT MAX(streak_len) FROM group_counts), 0) AS bestStreak`
    );

    return { currentStreak: row.currentStreak, bestStreak: row.bestStreak };
  };
}
