export interface QueryResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface SqlClient {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<QueryResult>;
}
