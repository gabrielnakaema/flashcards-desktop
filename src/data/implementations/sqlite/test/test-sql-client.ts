import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySqliteMigrations } from "../migrations";
import type { QueryResult, SqlClient } from "../sql-client";

function toNativePlaceholders(query: string): string {
  return query.replace(/\$(\d+)/g, "?");
}

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
    const statement = this.db.prepare(toNativePlaceholders(query));
    const result = statement.run(...bindValues);

    return {
      rowsAffected: result.changes,
      lastInsertId: Number(result.lastInsertRowid),
    };
  }

  async destroy(): Promise<void> {
    this.db.close();
    await rm(this.tempDir, { recursive: true, force: true });
  }
}
