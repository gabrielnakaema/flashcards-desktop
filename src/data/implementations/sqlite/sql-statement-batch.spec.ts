import { describe, expect, it } from "vitest";
import { buildSqlStatementBatch } from "./sql-statement-batch";

describe("buildSqlStatementBatch", () => {
  it("keeps argument values out of SQL text", () => {
    const untrustedValue = "'); DROP TABLE cards; --";

    const batch = buildSqlStatementBatch([
      {
        query: "INSERT INTO cards (id, front) VALUES ($1, $2)",
        args: ["card-1", untrustedValue],
      },
    ]);

    expect(batch.query).toBe(
      "INSERT INTO cards (id, front) VALUES ($1, $2)"
    );
    expect(batch.query).not.toContain(untrustedValue);
    expect(batch.args).toEqual(["card-1", untrustedValue]);
  });

  it("numbers arguments continuously across statements", () => {
    const batch = buildSqlStatementBatch([
      {
        query: "UPDATE cards SET front = $1 WHERE id = $2",
        args: ["Q", "1"],
      },
      { query: "DELETE FROM cards WHERE id = $1", args: ["2"] },
    ]);

    expect(batch.query).toBe(
      "UPDATE cards SET front = $1 WHERE id = $2;\nDELETE FROM cards WHERE id = $3"
    );
    expect(batch.args).toEqual(["Q", "1", "2"]);
  });

  it("rejects placeholder and argument count mismatches", () => {
    expect(() =>
      buildSqlStatementBatch([{ query: "SELECT $1, $2", args: [1] }])
    ).toThrow("SQL statement has more placeholders than arguments");
    expect(() =>
      buildSqlStatementBatch([{ query: "SELECT $1", args: [1, 2] }])
    ).toThrow("SQL statement has more arguments than placeholders");
  });
});
