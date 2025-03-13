import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Configure connection pool for production
const connectionOptions = {
  max: 10, // Maximum number of connections
  idle_timeout: 30, // Connection timeout in seconds
};

const conn =
  globalForDb.conn ??
  postgres(
    env.POSTGRES_URL,
    env.NODE_ENV === "production" ? connectionOptions : undefined,
  );

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
