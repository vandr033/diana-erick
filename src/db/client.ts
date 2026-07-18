import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";

if (process.env.NODE_ENV === "production" && !process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL es obligatorio en producción.");
}

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
