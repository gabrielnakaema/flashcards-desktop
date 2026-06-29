import type {
  Card,
  CardWithSchedule,
  CreateCardPayload,
  UpdateCardPayload,
} from "./types";

export interface CardRepository {
  createCard: (payload: CreateCardPayload) => Promise<Card>;
  bulkCreateCards: (payloads: CreateCardPayload[]) => Promise<Card[]>;
  updateCard: (payload: UpdateCardPayload) => Promise<Card>;
  deleteCard: (id: string) => Promise<void>;
  suspendCard: (id: string) => Promise<void>;
  unsuspendCard: (id: string) => Promise<void>;
  listCardsByDeck: (deckId: string) => Promise<CardWithSchedule[]>;
}
