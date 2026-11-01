"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginSchema, registerSchema } from "@/lib/validation";
import { looksLikeBot, rateLimit, verifyTurnstile } from "@/lib/spam";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { audit } from "@/lib/audit";
import { genericAlert, notifySales } from "@/lib/email";
import { STAFF_ROLES, type Role } from "@/lib/types";

export type AuthState = { error?: string; fieldErrors?: Record<string, string>; info?: string } | undefined;

const safeNext = (n: unknown, fallback: string) => (typeof n === "string" && /^\/(portal|admin)(\/|$|\?)/.test(n) ? n : fallback);

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Authentication is not configured yet. See README.md." };
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  if (isServiceRoleConfigured() && !(await rateLimit("login", 10, 600))) return { error: "Too many attempts. Please wait a few minutes." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "Invalid email or password." };   // generic: no account enumeration

  const { data: p } = await supabase.from("profiles").select("role,is_active").eq("id", data.user.id).maybeSingle();
  if (!p || !p.is_active) { await supabase.auth.signOut(); return { error: "This account is not active. Contact ProSelect." }; }
  if (isServiceRoleConfigured()) await audit({ id: data.user.id, email: data.user.email ?? "" }, "auth.login", "profile", data.user.id);
  const staff = STAFF_ROLES.includes(p.role as Role);
  redirect(safeNext(fd.get("next"), staff ? "/admin" : "/portal"));
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Registration is not configured yet. See README.md." };
  const raw = Object.fromEntries(fd.entries());
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[String(i.path[0])] ??= i.message));
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }
  const v = parsed.data;
  if (looksLikeBot(raw.hp, Number(raw.elapsedMs)) || !(await verifyTurnstile(String(raw.turnstile ?? "")))) return { error: "We could not verify this submission." };
  if (isServiceRoleConfigured() && !(await rateLimit("register", 5, 3600))) return { error: "Too many registrations from your connection. Try again later." };

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email, password: v.password,
    options: { data: { full_name: v.fullName, company_name: v.company, phone: v.phone }, emailRedirectTo: `${origin}/auth/callback?next=/portal` },
  });
  if (error) return { error: error.message.includes("registered") ? "An account with this email may already exist. Try signing in." : "We could not create your account. Please try again." };

  await notifySales(
    `New Client Registration: ${v.company || v.fullName}`,
    genericAlert("New Client Account Registered", [
      ["Full Name", v.fullName],
      ["Company", v.company || "Not specified"],
      ["Email Address", v.email],
      ["Phone Number", v.phone || "Not specified"],
    ])
  );

  if (data.session) redirect("/portal");
  return { info: "Account created. Check your email to confirm your address, then sign in." };
}

export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Authentication is not configured yet." };
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await (await createClient()).auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/portal/account` });
  return { info: "If an account exists for that email, a reset link has been sent." };
}

export async function signOut() {
  if (isSupabaseConfigured()) await (await createClient()).auth.signOut();
  redirect("/");
}

