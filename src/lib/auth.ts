import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { db } from "@/src/db/client";
import { adminUsers } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const cookieName = "admin_session";
const sessionDuration = 60 * 60 * 12;

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET es obligatorio en producción.");
  return new TextEncoder().encode(value || "desarrollo-seguro-auth-secret-de-32-caracteres");
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, normalizedEmail)).limit(1);
    const admin = rows[0];
    if (!admin || !(await compare(password, admin.passwordHash))) return null;
    return { id: admin.id, email: admin.email };
  } catch {
    return null;
  }
}

export async function createAdminSession(admin: { id: string; email: string }) {
  const token = await new SignJWT({ email: admin.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${sessionDuration}s`)
    .sign(getSecret());
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDuration,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export type AdminSession = JWTPayload & { email?: string; sub: string };

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return payload as AdminSession;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login" as never);
  return session;
}

export async function requireAdminApi() {
  return getAdminSession();
}
