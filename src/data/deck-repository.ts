import {
  CreateDeckCategoryPayload,
  CreateDeckPayload,
  Deck,
  DeckCategory,
  DeckWithStats,
  UpdateDeckCategoryPayload,
  UpdateDeckPayload,
} from "@/types/deck";

export interface DeckRepository {
  listCategories: () => Promise<DeckCategory[]>;
  createCategory: (payload: CreateDeckCategoryPayload) => Promise<DeckCategory>;
  updateCategory: (payload: UpdateDeckCategoryPayload) => Promise<DeckCategory>;
  deleteCategory: (id: string) => Promise<void>;
  listDeckWithStats: () => Promise<DeckWithStats[]>;
  createDeck: (payload: CreateDeckPayload) => Promise<Deck>;
  updateDeck: (payload: UpdateDeckPayload) => Promise<Deck>;
  deleteDeck: (id: string) => Promise<void>;
  getDeck: (id: string) => Promise<Deck>;
}
