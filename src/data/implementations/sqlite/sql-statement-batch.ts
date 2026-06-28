export interface SqlStatement {
  query: string;
  args: readonly unknown[];
}

interface SqlBatch {
  query: string;
  args: unknown[];
}

export const buildSqlStatementBatch = (
  statements: readonly SqlStatement[]
): SqlBatch => {
  const args: unknown[] = [];
  const queries = statements.map((statement) => {
    const argOffset = args.length;
    const referencedArgs = new Set<number>();
    const query = statement.query.replace(/\$(\d+)/g, (_, rawArgNumber) => {
      const argNumber = Number(rawArgNumber);
      if (argNumber < 1 || argNumber > statement.args.length) {
        throw new Error("SQL statement has more placeholders than arguments");
      }

      referencedArgs.add(argNumber);
      return `$${argOffset + argNumber}`;
    });

    if (referencedArgs.size !== statement.args.length) {
      throw new Error("SQL statement has more arguments than placeholders");
    }

    args.push(...statement.args);
    return query;
  });

  return { query: queries.join(";\n"), args };
};
