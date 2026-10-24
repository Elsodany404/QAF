/*
 * Minimal stand-in for the Supabase query builder used in unit tests.
 * Queue a result per table; every query on that table consumes the next one.
 * All calls are recorded so tests can assert what was written.
 */

type Result = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number;
};

export type RecordedQuery = {
  table: string;
  operation: "select" | "update" | "insert" | "delete" | "rpc";
  payload?: unknown;
  filters: [string, string, unknown][];
};

export function createFakeSupabase() {
  const queues = new Map<string, Result[]>();
  const queries: RecordedQuery[] = [];

  function next(table: string): Result {
    const queue = queues.get(table);
    const result = queue?.shift();
    if (!result) {
      throw new Error(`fakeSupabase: no result queued for "${table}"`);
    }
    return { data: null, error: null, ...result };
  }

  function builder(table: string, query: RecordedQuery) {
    let resolved: Result | null = null;
    const resolve = () => (resolved ??= next(table));

    const chain: Record<string, unknown> = {};
    for (const op of ["select", "update", "insert", "delete"] as const) {
      chain[op] = (payload?: unknown) => {
        // select() after update()/insert() just shapes the returned row.
        if (op !== "select" || query.operation === "select") {
          query.operation = op;
          if (op !== "select") query.payload = payload;
        }
        return chain;
      };
    }
    for (const filter of ["eq", "in", "ilike", "or", "neq", "is"] as const) {
      chain[filter] = (column: string, value: unknown) => {
        query.filters.push([filter, column, value]);
        return chain;
      };
    }
    chain.order = () => chain;
    chain.single = () => Promise.resolve(resolve());
    chain.maybeSingle = () => Promise.resolve(resolve());
    chain.then = (
      onFulfilled: (value: Result) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve().then(resolve).then(onFulfilled, onRejected);
    return chain;
  }

  const client = {
    from(table: string) {
      const query: RecordedQuery = { table, operation: "select", filters: [] };
      queries.push(query);
      return builder(table, query);
    },
    rpc(name: string, payload: unknown) {
      queries.push({ table: name, operation: "rpc", payload, filters: [] });
      return Promise.resolve(next(name));
    },
  };

  return {
    client,
    queries,
    queue(table: string, ...results: Result[]) {
      queues.set(table, [...(queues.get(table) ?? []), ...results]);
    },
    updates(table: string) {
      return queries.filter(
        (q) => q.table === table && q.operation === "update",
      );
    },
    reset() {
      queues.clear();
      queries.length = 0;
    },
  };
}
