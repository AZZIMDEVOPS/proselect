import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * DB-backed fixed-window rate limiter (works across serverless instances).
 * Fails OPEN on infrastructure errors so a DB hiccup never blocks legitimate enquiries.
 */
export async function rateLimit(scope: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const ip = await clientIp();
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: `${scope}:${ip}`, p_limit: limit, p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch (e) {
    console.error("rate limit check failed", e);
    return true;
  }
}

/** Cloudflare Turnstile verification. No-op unless TURNSTILE_SECRET_KEY is configured. */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: await clientIp() }),
    });
    const json = (await res.json()) as { success: boolean };
    return json.success;
  } catch {
    return false;
  }
}

/** Honeypot + minimum-fill-time trap. `elapsedMs` is measured client-side from first render. */
export function looksLikeBot(honeypot: unknown, elapsedMs: unknown) {
  if (typeof honeypot === "string" && honeypot.length > 0) return true;
  const t = Number(elapsedMs);
  return Number.isFinite(t) && t > 0 && t < 2500;
}

