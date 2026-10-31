"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, isStaffRole } from "@/lib/auth";
import { genericAlert, notifySales } from "@/lib/email";
import { audit } from "@/lib/audit";
import { SITE } from "@/lib/site";

type R = { ok: true } | { ok: false; error: string };

/** Message on an RFQ thread — sender must be the owning client or staff (enforced again by RLS). */
export async function sendMessage(rfqId: string, body: string): Promise<R> {
  const s = await getSession();
  if (!s) return { ok: false, error: "Please sign in." };
  const text = body.trim();
  if (text.length < 1 || text.length > 5000) return { ok: false, error: "Message must be 1–5000 characters." };
  const staff = isStaffRole(s.role);
  const sb = await createClient();
  const { error } = await sb.from("messages").insert({ rfq_id: rfqId, sender_id: s.id, from_staff: staff, body: text });
  if (error) return { ok: false, error: "You cannot post to this inquiry." };

  const admin = createAdminClient();
  const { data: rfq } = await admin.from("rfqs").select("reference,user_id,client_id,id").eq("id", rfqId).single();
  if (rfq) {
    if (staff && rfq.client_id) {
      const { data: c } = await admin.from("clients").select("primary_user_id").eq("id", rfq.client_id).single();
      if (c?.primary_user_id) await admin.from("notifications").insert({ user_id: c.primary_user_id, title: `New message on ${rfq.reference}`, body: text.slice(0, 140), link: `/portal/inquiries/${rfq.id}` });
    } else if (!staff) {
      await notifySales(`Client message on ${rfq.reference}`, genericAlert(`Client message on ${rfq.reference}`, [["From", s.full_name ?? s.email], ["Company", s.company], ["Message", text]], `${SITE.url}/admin/rfqs/${rfq.id}`), s.email);
    }
  }
  revalidatePath(`/portal/inquiries/${rfqId}`); revalidatePath(`/admin/rfqs/${rfqId}`);
  return { ok: true };
}

export async function respondToQuotation(id: string, decision: "accepted" | "revision_requested" | "declined", note: string): Promise<R> {
  const s = await getSession();
  if (!s || isStaffRole(s.role)) return { ok: false, error: "Only the client can respond to a quotation." };
  if (decision === "revision_requested" && note.trim().length < 5) return { ok: false, error: "Please describe the revisions you need." };
  const sb = await createClient();
  const { error } = await sb.rpc("respond_to_quotation", { p_id: id, p_decision: decision, p_note: note.trim().slice(0, 2000) });
  if (error) return { ok: false, error: error.message.replace(/^.*?: /, "") || "Could not record your response." };

  const admin = createAdminClient();
  const { data: q } = await admin.from("quotations").select("reference,rfq_id").eq("id", id).single();
  if (q) {
    await notifySales(`Quotation ${q.reference}: ${decision.replace("_", " ")}`, genericAlert(`Client response to ${q.reference}`, [
      ["Decision", decision.replace("_", " ")], ["Client", `${s.full_name ?? ""} (${s.company ?? s.email})`], ["Note", note],
      ["Important", "Acceptance is recorded only. Contractual workflows start when authorised by ProSelect."],
    ], `${SITE.url}/admin/quotations/${id}`), s.email);
  }
  await audit({ id: s.id, email: s.email }, `quotation.client_${decision}`, "quotation", id);
  revalidatePath("/portal", "layout"); revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function markNotificationsRead(): Promise<void> {
  const s = await getSession();
  if (!s) return;
  await (await createClient()).from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", s.id).is("read_at", null);
  revalidatePath("/portal", "layout"); revalidatePath("/admin", "layout");
}

export async function updatePassword(pw: string): Promise<R> {
  if (pw.length < 10 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return { ok: false, error: "Use 10+ characters with upper, lower case and a number." };
  const { error } = await (await createClient()).auth.updateUser({ password: pw });
  return error ? { ok: false, error: "Could not update password. Please sign in again and retry." } : { ok: true };
}

