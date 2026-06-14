import {
  CreateDeckCategoryPayload,
  CreateDeckPayload,
  Deck,
  DeckCategory,
  DeckWithStats,
  UpdateDeckPayload,
} from "@/types/deck";

export interface DeckRepository {
  listCategories: () => Promise<DeckCategory[]>;
  createCategory: (payload: CreateDeckCategoryPayload) => Promise<DeckCategory>;
  listDeckWithStats: () => Promise<DeckWithStats[]>;
  createDeck: (payload: CreateDeckPayload) => Promise<Deck>;
  updateDeck: (payload: UpdateDeckPayload) => Promise<Deck>;
  deleteDeck: (id: string) => Promise<void>;
}
