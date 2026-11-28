import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * HQ has no login; anyone with the link can read it. Writing (generating,
 * editing and publishing insights) needs HQ_ADMIN_KEY, set in .env.local and
 * on Vercel. Signing in stores a cookie holding an HMAC of the key, never the
 * key itself; every server action checks it again, because hiding a button
 * is not a security boundary. Without the key set, writing stays off.
 */

const COOKIE = "hq_admin";
const MAX_AGE = 30 * 24 * 60 * 60;

function adminKey(): string | null {
  const key = process.env.HQ_ADMIN_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

export function adminConfigured(): boolean {
  return adminKey() !== null;
}

function token(key: string): string {
  return createHmac("sha256", key).update("hq-admin-v1").digest("hex");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isAdmin(): Promise<boolean> {
  const key = adminKey();
  if (!key) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return typeof value === "string" && same(value, token(key));
}

/** Throws unless the request carries the admin cookie. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Sign in to HQ writing first.");
}

/** Sets the cookie when the typed key matches; false otherwise. */
export async function signIn(typed: string): Promise<boolean> {
  const key = adminKey();
  if (!key || !same(typed.trim(), key)) return false;
  (await cookies()).set(COOKIE, token(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
