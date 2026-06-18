import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySqliteMigrations } from "../migrations";
import type { QueryResult, SqlClient } from "../sql-client";

const toNativePlaceholders = (query: string): string => {
  return query.replace(/\$(\d+)/g, "?");
};

const splitStatements = (query: string): string[] => {
  return query
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};

const runStatement = (
  db: Database.Database,
  statementSql: string,
  bindValues: unknown[]
): Database.RunResult | null => {
  const placeholderNumbers = [...statementSql.matchAll(/\$(\d+)/g)].map(
    (match) => Number(match[1])
  );

  if (placeholderNumbers.length === 0) {
    db.exec(`${statementSql};`);
    return null;
  }

  const min = Math.min(...placeholderNumbers);
  const max = Math.max(...placeholderNumbers);
  const statementBinds = bindValues.slice(min - 1, max);
  const renumberedSql = toNativePlaceholders(
    statementSql.replace(/\$(\d+)/g, (_, num) => `$${Number(num) - min + 1}`)
  );

  return db.prepare(renumberedSql).run(...statementBinds);
};

export class TestSqlClient implements SqlClient {
  private readonly db: Database.Database;
  private readonly tempDir: string;

  private constructor(db: Database.Database, tempDir: string) {
    this.db = db;
    this.tempDir = tempDir;
  }

  static async create(): Promise<TestSqlClient> {
    const tempDir = await mkdtemp(join(tmpdir(), "flashcards-test-"));
    const dbPath = join(tempDir, `${randomUUID()}.db`);
    const db = new Database(dbPath);
    applySqliteMigrations((sql) => db.exec(sql));
    return new TestSqlClient(db, tempDir);
  }

  async select<T>(query: string, bindValues: unknown[] = []): Promise<T> {
    const statement = this.db.prepare(toNativePlaceholders(query));
    const normalizedQuery = query.trimStart().toUpperCase();

    if (normalizedQuery.startsWith("SELECT")) {
      return statement.all(...bindValues) as T;
    }

    return statement.all(...bindValues) as T;
  }

  async execute(
    query: string,
    bindValues: unknown[] = []
  ): Promise<QueryResult> {
    const statements = splitStatements(query);

    if (statements.length === 1) {
      const result = runStatement(this.db, statements[0], bindValues);
      return {
        rowsAffected: result?.changes ?? 0,
        lastInsertId: result ? Number(result.lastInsertRowid) : undefined,
      };
    }

    let rowsAffected = 0;
    let lastInsertId: number | undefined;

    for (const statementSql of statements) {
      const result = runStatement(this.db, statementSql, bindValues);
      if (!result) {
        continue;
      }

      rowsAffected += result.changes;
      lastInsertId = Number(result.lastInsertRowid);
    }

    return { rowsAffected, lastInsertId };
  }

  async destroy(): Promise<void> {
    this.db.close();
    await rm(this.tempDir, { recursive: true, force: true });
  }
}
