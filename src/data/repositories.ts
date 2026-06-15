import { CardSqliteRepository } from "./implementations/sqlite/card-sqlite-repository";
import { DeckSqliteRepository } from "./implementations/sqlite/deck-sqlite-repository";

export const deckRepository = new DeckSqliteRepository();
export const cardRepository = new CardSqliteRepository();
