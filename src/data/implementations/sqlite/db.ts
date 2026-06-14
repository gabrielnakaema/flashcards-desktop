import Database from "@tauri-apps/plugin-sql";
import type { SqlClient } from "./sql-client";

export const DATABASE_PATH = "sqlite:flashcards.db";

let dbInstance: SqlClient | undefined;

export async function initDb(): Promise<SqlClient> {
  if (!dbInstance) {
    dbInstance = await Database.load(DATABASE_PATH);
  }

  return dbInstance;
}

export function getDb(): SqlClient {
  if (!dbInstance) {
    throw new Error(
      "Database not initialized. Call initDb() before using repositories."
    );
  }

  return dbInstance;
}
