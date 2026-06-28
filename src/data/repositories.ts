import { CardSqliteRepository } from "./implementations/sqlite/card-sqlite-repository";
import { CardStatisticsSqliteRepository } from "./implementations/sqlite/card-statistics-sqlite-repository";
import { DeckSqliteRepository } from "./implementations/sqlite/deck-sqlite-repository";
import { StudySqliteRepository } from "./implementations/sqlite/study-sqlite-repository";

export const deckRepository = new DeckSqliteRepository();
export const cardRepository = new CardSqliteRepository();
export const studyRepository = new StudySqliteRepository();
export const cardStatisticsRepository = new CardStatisticsSqliteRepository();
