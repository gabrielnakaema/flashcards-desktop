import type {
  Card,
  CardSchedule,
  CardWithSchedule,
  CreateCardPayload,
  ReviewLog,
  SubmitReviewPayload,
  UpdateCardPayload,
} from "@/types/card";

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
}
