export type CardStats = {
  cardsDueNow: number;
  cardsReviewedToday: number;
  totalCardsInDecks: number;
  totalCardsReviewedThisWeek: number;
  deckIdWithMostCardsDue: string;
  mostCardsDueInDeck: number;
  deckCount: number;
  nextDueAt: string | null;
};

export type Streak = {
  currentStreak: number;
  bestStreak: number;
};

export interface CardStatisticsRepository {
  getStats: (date: Date) => Promise<CardStats>;
  getStreak: () => Promise<Streak>;
}
