import createInitialTables from "./001_create_initial_tables.sql?raw";

export interface SqliteMigration {
  version: number;
  description: string;
  sql: string;
}

export const SQLITE_MIGRATIONS: readonly SqliteMigration[] = [
  {
    version: 1,
    description: "create_initial_tables",
    sql: createInitialTables,
  },
];

export const applySqliteMigrations = (
  exec: (sql: string) => void,
  migrations: readonly SqliteMigration[] = SQLITE_MIGRATIONS
): void => {
  for (const migration of migrations) {
    exec(migration.sql);
  }
};
