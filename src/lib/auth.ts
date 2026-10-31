import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { STAFF_ROLES, type Role } from "@/lib/types";

export interface SessionProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  organization_id: string | null;
  client_id: string | null;
  company: string | null;
}

/** Current user + profile (cached per request). Returns null when signed out or Supabase isn't configured. */
export const getSession = cache(async (): Promise<SessionProfile | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: p } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,organization_id,is_active")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!p || !p.is_active) return null;
  const { data: c } = await supabase.from("clients").select("id").eq("primary_user_id", p.id).maybeSingle();
  let company: string | null = null;
  if (p.organization_id) {
    const { data: o } = await supabase.from("organizations").select("name").eq("id", p.organization_id).maybeSingle();
    company = o?.name ?? null;
  }
  return {
    id: p.id, email: p.email, full_name: p.full_name, role: p.role as Role,
    organization_id: p.organization_id, client_id: c?.id ?? null, company,
  };
});

export const isStaffRole = (r: Role) => STAFF_ROLES.includes(r);

export async function requireClient(): Promise<SessionProfile> {
  const s = await getSession();
  if (!s) redirect("/login?next=/portal");
  if (isStaffRole(s.role)) redirect("/admin");
  return s;
}

export async function requireStaff(allowed: Role[] = STAFF_ROLES): Promise<SessionProfile> {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (!isStaffRole(s.role)) redirect("/portal");
  if (!allowed.includes(s.role)) redirect("/admin?denied=1");
  return s;
}

/** For server actions: throws instead of redirecting. */
export async function assertRole(allowed: Role[]): Promise<SessionProfile> {
  const s = await getSession();
  if (!s || !allowed.includes(s.role)) throw new Error("You do not have permission to perform this action.");
  return s;
}

