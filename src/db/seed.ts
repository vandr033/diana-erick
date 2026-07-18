import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { defaultEvents, defaultSettings } from "@/src/lib/defaults";
import { adminUsers, events, siteSettings } from "./schema";

function loadLocalEnv() {
  const shellKeys = new Set(Object.keys(process.env));
  for (const filename of [".env", ".env.local"]) {
    if (!existsSync(filename)) continue;
    for (const line of readFileSync(filename, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || shellKeys.has(match[1])) continue;
      const value = match[2].replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = value;
    }
  }
}

loadLocalEnv();

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const db = drizzle(client);

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() ||
    (process.env.ADMIN_PASSWORD ? await hash(process.env.ADMIN_PASSWORD, 12) : null);

  if (!email || !passwordHash) {
    throw new Error("Configura ADMIN_EMAIL y ADMIN_PASSWORD, o ADMIN_PASSWORD_HASH, antes de ejecutar el seed.");
  }

  const now = new Date();
  const settings = { ...defaultSettings, updatedAt: now };
  await db.insert(siteSettings).values(settings).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...settings, updatedAt: now },
  });

  for (const event of defaultEvents) {
    const eventData = { ...event, createdAt: now, updatedAt: now };
    await db.insert(events).values(eventData).onConflictDoUpdate({
      target: events.slug,
      set: { ...eventData, updatedAt: now },
    });
  }

  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing[0]) {
    await db.update(adminUsers).set({ passwordHash, updatedAt: now }).where(eq(adminUsers.id, existing[0].id));
  } else {
    await db.insert(adminUsers).values({ id: randomUUID(), email, passwordHash, createdAt: now, updatedAt: now });
  }

  console.log("Seed completado para", email);
}

main().catch((error) => {
  console.error("No fue posible completar el seed.", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
