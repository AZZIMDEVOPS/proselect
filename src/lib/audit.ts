import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function audit(
  actor: { id: string; email: string } | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  try {
    await createAdminClient().from("audit_logs").insert({
      actor_id: actor?.id ?? null, actor_email: actor?.email ?? null,
      action, entity_type: entityType ?? null, entity_id: entityId ?? null, details: details ?? null,
    });
  } catch (e) {
    console.error("audit log failed", action, e);
  }
}

