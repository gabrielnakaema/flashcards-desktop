import type {
  Card,
  CardSchedule,
  CardWithSchedule,
  CreateCardPayload,
  ReviewLog,
  SubmitReviewPayload,
  UpdateCardPayload,
} from "@/types/card";

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

export interface CardRepository {
  createCard: (payload: CreateCardPayload) => Promise<Card>;
  bulkCreateCards: (payloads: CreateCardPayload[]) => Promise<Card[]>;
  updateCard: (payload: UpdateCardPayload) => Promise<Card>;
  deleteCard: (id: string) => Promise<void>;
  getCard: (id: string) => Promise<Card>;
  listCardsByDeck: (deckId: string) => Promise<CardWithSchedule[]>;
  getDueCards: (deckId: string) => Promise<CardWithSchedule[]>;
  getSchedule: (cardId: string) => Promise<CardSchedule>;
  submitReview: (payload: SubmitReviewPayload) => Promise<ReviewLog>;
  resetDeckStudyProgress: (deckId: string) => Promise<void>;
  getStats: (date: Date) => Promise<CardStats>;
}
