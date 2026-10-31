"use server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { contactSchema, manufacturerSchema, rfqSchema } from "@/lib/validation";
import { looksLikeBot, rateLimit, verifyTurnstile } from "@/lib/spam";
import { clean } from "@/lib/utils";
import { genericAck, genericAlert, notifySales, rfqClientAck, rfqSalesAlert, sendMail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { SITE } from "@/lib/site";
import type { Division } from "@/lib/types";

export type ActionResult =
  | { ok: true; reference: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  error: "This form cannot accept submissions yet because the database is not configured. Please email info@proselectimports.com.",
};
const BOT: ActionResult = { ok: false, error: "We could not verify this submission. Please try again." };
const LIMITED: ActionResult = { ok: false, error: "Too many submissions from your connection. Please wait a few minutes and try again." };

function zodErrors(err: import("zod").ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const i of err.issues) fieldErrors[i.path.join(".")] ??= i.message;
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}

// ---------------------------------------------------------------- CONTACT
export async function submitContact(raw: unknown): Promise<ActionResult> {
  if (!isServiceRoleConfigured()) return NOT_CONFIGURED;
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return zodErrors(parsed.error);
  const v = parsed.data;
  if (looksLikeBot(v.hp, v.elapsedMs) || !(await verifyTurnstile(v.turnstile))) return BOT;
  if (!(await rateLimit("contact", 5, 600))) return LIMITED;

  const { data, error } = await createAdminClient().from("leads").insert({
    source: "contact_form", category: v.category, name: clean(v.name), company: clean(v.company ?? "") || null,
    email: v.email, phone: clean(v.phone ?? "") || null, message: clean(v.message),
  }).select("reference").single();
  if (error || !data) { console.error(error); return { ok: false, error: "We could not save your message. Please try again shortly." }; }

  await Promise.all([
    notifySales(`New lead ${data.reference} — ${v.category}`, genericAlert(`New contact lead ${data.reference}`, [
      ["Name", v.name], ["Company", v.company], ["Email", v.email], ["Phone", v.phone], ["Category", v.category], ["Message", v.message],
    ], `${SITE.url}/admin/leads`), v.email),
    sendMail({ to: v.email, subject: `We received your message (${data.reference})`, html: genericAck("Thank you for contacting ProSelect", v.name, [
      `Your message has been logged under reference ${data.reference}. A member of our team will respond shortly.`,
    ]) }),
  ]);
  return { ok: true, reference: data.reference };
}

// ---------------------------------------------------------------- RFQ
export async function submitRfq(raw: unknown): Promise<ActionResult> {
  if (!isServiceRoleConfigured()) return NOT_CONFIGURED;
  const parsed = rfqSchema.safeParse(raw);
  if (!parsed.success) return zodErrors(parsed.error);
  const v = parsed.data;
  if (looksLikeBot(v.hp, v.elapsedMs) || !(await verifyTurnstile(v.turnstile))) return BOT;
  if (!(await rateLimit("rfq", 6, 3600))) return LIMITED;

  const db = createAdminClient();
  const session = await getSession();
  const clientId = session?.role === "client" ? session.client_id : null;

  // Resolve catalogue products server-side (never trust client-supplied names).
  const slugs = v.items.map((i) => i.productSlug).filter(Boolean) as string[];
  const prodMap = new Map<string, { id: string; name: string; model: string | null; division: Division; category: string }>();
  if (slugs.length) {
    const { data } = await db.from("products").select("id,slug,name,model,product_categories(name,division)").in("slug", slugs).eq("status", "published");
    (data ?? []).forEach((p) => {
      const c = p.product_categories as unknown as { name: string; division: Division };
      prodMap.set(p.slug, { id: p.id, name: p.name, model: p.model, division: c.division, category: c.name });
    });
  }
  const category = v.items.map((i) => (i.productSlug ? prodMap.get(i.productSlug)?.division : (i.category as Division | undefined))).find(Boolean) ?? null;

  const { data: rfq, error } = await db.from("rfqs").insert({
    client_id: clientId, user_id: session?.id ?? null, category,
    company_name: clean(v.company), contact_person: clean(v.contact), email: v.email, phone: clean(v.phone),
    project_location: clean(v.location), county_country: clean(v.countyCountry), intended_application: clean(v.application),
    procurement_timeline: v.timeline, additional_requirements: clean(v.additional ?? "") || null,
    delivery_destination: clean(v.destination), delivery_arrangement: v.arrangement,
    site_accessibility: clean(v.siteAccess ?? "") || null,
    logistics_support: v.logisticsSupport.join(", ") || null,
  }).select("id,reference").single();
  if (error || !rfq) { console.error(error); return { ok: false, error: "We could not save your request. Please try again shortly." }; }

  const itemRows = v.items.map((i) => {
    const p = i.productSlug ? prodMap.get(i.productSlug) : undefined;
    return {
      rfq_id: rfq.id, product_id: p?.id ?? null,
      custom_description: i.custom ? clean(i.description ?? "") : null,
      category_label: p?.category ?? (i.category || null), model: clean(i.model ?? "") || p?.model || null,
      preferred_manufacturer: clean(i.preferredManufacturer ?? "") || null, quantity: i.quantity,
      specifications: clean(i.specifications ?? "") || null, power_requirements: clean(i.power ?? "") || null,
      accessories: clean(i.accessories ?? "") || null, spare_parts: clean(i.spareParts ?? "") || null,
      maintenance: clean(i.maintenance ?? "") || null, custom_configuration: clean(i.customConfiguration ?? "") || null,
    };
  });
  const { error: itemErr } = await db.from("rfq_items").insert(itemRows);
  if (itemErr) {
    console.error(itemErr);
    await db.from("rfqs").delete().eq("id", rfq.id); // keep RFQs atomic: no header without items
    return { ok: false, error: "We could not save your request. Please try again shortly." };
  }

  const itemLabels = v.items.map((i) => `${i.quantity} × ${(i.productSlug && prodMap.get(i.productSlug)?.name) || i.description?.slice(0, 80) || "Custom equipment"}`);
  await audit(session ? { id: session.id, email: session.email } : null, "rfq.submitted", "rfq", rfq.id, { reference: rfq.reference });

  if (session?.id) {
    await db.from("notifications").insert({ user_id: session.id, title: `RFQ ${rfq.reference} received`, body: "Your request is with our procurement team.", link: "/portal/inquiries" });
  }
  await Promise.all([
    notifySales(`New RFQ ${rfq.reference} — ${v.company}`, rfqSalesAlert({
      reference: rfq.reference, company: v.company, contact: v.contact, email: v.email, phone: v.phone, category,
      location: v.location, items: itemLabels, url: `${SITE.url}/admin/rfqs/${rfq.id}`,
    }), v.email),
    sendMail({ to: v.email, subject: `RFQ ${rfq.reference} received — ProSelect`, html: rfqClientAck({ reference: rfq.reference, contact: v.contact, items: itemLabels }) }),
  ]);
  return { ok: true, reference: rfq.reference };
}

// ---------------------------------------------------------------- MANUFACTURER APPLICATION
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const SIGNATURES: Record<string, { ext: string; magic: number[] }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
};

export async function submitManufacturerApplication(fd: FormData): Promise<ActionResult> {
  if (!isServiceRoleConfigured()) return NOT_CONFIGURED;
  const raw = JSON.parse(String(fd.get("payload") ?? "{}"));
  const parsed = manufacturerSchema.safeParse(raw);
  if (!parsed.success) return zodErrors(parsed.error);
  const v = parsed.data;
  if (looksLikeBot(v.hp, v.elapsedMs) || !(await verifyTurnstile(v.turnstile))) return BOT;
  if (!(await rateLimit("mfr", 3, 3600))) return LIMITED;

  const db = createAdminClient();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return { ok: false, error: `Attach at most ${MAX_FILES} files.` };

  const folder = `applications/${randomUUID()}`;
  const attachments: { path: string; name: string; kind: string }[] = [];
  for (const f of files) {
    const sig = SIGNATURES[f.type];
    if (!sig) return { ok: false, error: `“${f.name}”: only PDF, JPG or PNG files are accepted.` };
    if (f.size > MAX_BYTES) return { ok: false, error: `“${f.name}” exceeds the 10 MB limit.` };
    const buf = Buffer.from(await f.arrayBuffer());
    if (!sig.magic.every((b, i) => buf[i] === b)) return { ok: false, error: `“${f.name}” does not appear to be a valid ${sig.ext.toUpperCase()} file.` };
    const path = `${folder}/${randomUUID()}.${sig.ext}`;
    const { error } = await db.storage.from("manufacturer-submissions").upload(path, buf, { contentType: f.type, upsert: false });
    if (error) { console.error(error); return { ok: false, error: "File upload failed. Please try again." }; }
    attachments.push({ path, name: f.name.replace(/[^\w.\- ]/g, "_").slice(0, 120), kind: f.type });
  }

  const { data, error } = await db.from("manufacturer_applications").insert({
    company_name: clean(v.company), country_of_manufacture: clean(v.country), website: clean(v.website ?? "") || null,
    contact_person: clean(v.contact), email: v.email, phone: clean(v.phone ?? "") || null,
    product_categories: v.categories, products_summary: clean(v.products), certifications: clean(v.certifications ?? "") || null,
    representation_arrangement: v.arrangement, message: clean(v.message ?? "") || null, attachments,
  }).select("id,reference").single();
  if (error || !data) { console.error(error); return { ok: false, error: "We could not save your application. Please try again shortly." }; }

  await audit(null, "manufacturer_application.submitted", "manufacturer_application", data.id, { reference: data.reference });
  await Promise.all([
    notifySales(`Manufacturer application ${data.reference} — ${v.company}`, genericAlert(`New manufacturer application ${data.reference}`, [
      ["Company", v.company], ["Country", v.country], ["Contact", v.contact], ["Email", v.email], ["Categories", v.categories.join(", ")],
      ["Arrangement", v.arrangement], ["Attachments", attachments.length],
    ], `${SITE.url}/admin/applications`), v.email),
    sendMail({ to: v.email, subject: `Partnership application ${data.reference} received`, html: genericAck("Thank you for your partnership application", v.contact, [
      `Your application for ${v.company} has been logged under reference ${data.reference} and entered into our approval workflow.`,
      "Submitting an application does not grant access to any client or commercial information and does not constitute an agreement. Our business development team will contact you.",
    ]) }),
  ]);
  return { ok: true, reference: data.reference };
}
