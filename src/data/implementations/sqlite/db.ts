import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import type { SqlClient } from "./sql-client";

let dbInstance: SqlClient | undefined;

export const initDb = async (): Promise<SqlClient> => {
  if (!dbInstance) {
    const path = await invoke<string>("database_path");
    dbInstance = await Database.load(path);
  }

  return dbInstance;
};

export const getDb = (): SqlClient => {
  if (!dbInstance) {
    throw new Error(
      "Database not initialized. Call initDb() before using repositories."
    );
  }

  return dbInstance;
};
