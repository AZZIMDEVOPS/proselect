"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { renderQuotationPdf } from "@/lib/pdf/quotation-pdf";
import { quoteTotals, type QItem } from "@/lib/quote";
import { genericAck, sendMail } from "@/lib/email";
import { SITE } from "@/lib/site";
import { clean, slugify } from "@/lib/utils";
import { COMMERCIAL_ROLES, OPS_ROLES, STAFF_ROLES, ORDER_STAGES, type Division, type Role, type Spec, type ConfigOption } from "@/lib/types";

export type AdminResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

const ADMIN_ROLES: Role[] = ["super_admin", "admin"];

function revalidateAll(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

// ----------------------------------------------------------------INTERNAL NOTES
export async function addInternalNote(input: {
  entity_type: "rfq" | "client" | "manufacturer" | "order" | "quotation" | "lead" | "application";
  entity_id: string;
  body: string;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole(STAFF_ROLES);
    const body = clean(input.body);
    if (body.length < 2 || body.length > 5000) return { ok: false, error: "Note must be 2–5,000 characters." };
    const db = createAdminClient();
    const { error } = await db.from("internal_notes").insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      body,
      author_id: actor.id,
    });
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "internal_note.added", input.entity_type, input.entity_id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add note." };
  }
}

// ----------------------------------------------------------------RFQS
export async function updateRfqAdmin(
  rfqId: string,
  patch: { status: string; assigned_to?: string | null; follow_up_at?: string | null },
): Promise<AdminResult> {
  try {
    const actor = await assertRole(STAFF_ROLES);
    const db = createAdminClient();
    const { data: rfq, error } = await db
      .from("rfqs")
      .update({
        status: patch.status,
        assigned_to: patch.assigned_to || null,
        follow_up_at: patch.follow_up_at || null,
      })
      .eq("id", rfqId)
      .select("id,reference,client_id")
      .single();
    if (error || !rfq) throw error ?? new Error("RFQ not found");

    if (rfq.client_id) {
      const { data: cl } = await db.from("clients").select("primary_user_id").eq("id", rfq.client_id).maybeSingle();
      if (cl?.primary_user_id) {
        await db.from("notifications").insert({
          user_id: cl.primary_user_id,
          title: `RFQ ${rfq.reference} status updated`,
          body: `Status changed to ${patch.status.replace(/_/g, " ")}.`,
          link: `/portal/inquiries/${rfq.id}`,
        });
      }
    }

    await audit({ id: actor.id, email: actor.email }, "rfq.updated", "rfq", rfqId, patch);
    revalidateAll(`/admin/rfqs`, `/admin/rfqs/${rfqId}`, `/portal/inquiries/${rfqId}`, `/portal`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update RFQ." };
  }
}

export async function recordManufacturerEngagement(input: {
  rfq_id: string;
  manufacturer_id: string;
  status: "contacted" | "awaiting_response" | "quote_received" | "declined" | "confirmed";
  note?: string;
  follow_up_at?: string | null;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    if (!input.manufacturer_id) return { ok: false, error: "Select a manufacturer." };
    const db = createAdminClient();
    const { error } = await db.from("manufacturer_engagements").insert({
      rfq_id: input.rfq_id,
      manufacturer_id: input.manufacturer_id,
      status: input.status,
      note: clean(input.note ?? "") || null,
      follow_up_at: input.follow_up_at || null,
      created_by: actor.id,
    });
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "rfq.manufacturer_engaged", "rfq", input.rfq_id, {
      manufacturer_id: input.manufacturer_id, status: input.status,
    });
    revalidateAll(`/admin/rfqs/${input.rfq_id}`, `/admin/manufacturers/${input.manufacturer_id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not record manufacturer engagement." };
  }
}

// ----------------------------------------------------------------QUOTATIONS
export interface SaveQuotationInput {
  id?: string;
  rfq_id: string;
  currency: "USD" | "KES" | "EUR" | "GBP" | "CNY";
  validity_until?: string | null;
  delivery_estimate?: string;
  logistics_estimate?: string;
  incoterm?: string;
  payment_terms?: string;
  commercial_terms?: string;
  tax_label?: string;
  tax_rate: number;
  logistics_charge: number;
  other_charges: number;
  other_charges_label?: string;
  items: { product_id?: string | null; description: string; quantity: number; unit_price: number }[];
  // INTERNAL ONLY — persisted strictly in quotation_internal_costs (never exposed to clients)
  internal: {
    manufacturer_cost_total: number;
    logistics_cost_total: number;
    other_internal_costs: number;
    notes?: string;
  };
}

export async function saveQuotation(input: SaveQuotationInput): Promise<AdminResult<{ id: string }>> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const items = input.items
      .map((i, idx) => ({
        product_id: i.product_id || null,
        description: clean(i.description),
        quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
        unit_price: Math.max(0, Number(i.unit_price) || 0),
        sort_order: idx,
      }))
      .filter((i) => i.description.length > 0);
    if (!items.length) return { ok: false, error: "Add at least one line item with a description." };

    const db = createAdminClient();
    const { data: rfq } = await db.from("rfqs").select("id,client_id,company_name,contact_person,email,phone").eq("id", input.rfq_id).maybeSingle();
    if (!rfq) return { ok: false, error: "Linked RFQ not found." };

    // Ensure a client record exists even if the RFQ was submitted before portal sign-up.
    let clientId = rfq.client_id as string | null;
    if (!clientId) {
      const { data: existingClient } = await db.from("clients").select("id").eq("email", rfq.email).maybeSingle();
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: org } = await db.from("organizations").insert({ name: rfq.company_name.slice(0, 200), kind: "client" }).select("id").single();
        if (org) {
          const { data: created } = await db.from("clients").insert({
            organization_id: org.id, contact_name: rfq.contact_person, email: rfq.email, phone: rfq.phone,
          }).select("id").single();
          clientId = created?.id ?? null;
        }
      }
      if (clientId) await db.from("rfqs").update({ client_id: clientId }).eq("id", rfq.id);
    }

    const header = {
      rfq_id: input.rfq_id,
      client_id: clientId,
      currency: input.currency,
      validity_until: input.validity_until || null,
      delivery_estimate: clean(input.delivery_estimate ?? "") || null,
      logistics_estimate: clean(input.logistics_estimate ?? "") || null,
      incoterm: clean(input.incoterm ?? "") || null,
      payment_terms: clean(input.payment_terms ?? "") || null,
      commercial_terms: clean(input.commercial_terms ?? "") || null,
      tax_label: clean(input.tax_label ?? "VAT") || "VAT",
      tax_rate: Math.min(100, Math.max(0, Number(input.tax_rate) || 0)),
      logistics_charge: Math.max(0, Number(input.logistics_charge) || 0),
      other_charges: Math.max(0, Number(input.other_charges) || 0),
      other_charges_label: clean(input.other_charges_label ?? "") || null,
    };

    let qId: string;
    if (input.id) {
      qId = input.id;
      const { error } = await db.from("quotations").update(header).eq("id", qId);
      if (error) throw error;
      await db.from("quotation_items").delete().eq("quotation_id", qId);
    } else {
      const { data, error } = await db
        .from("quotations")
        .insert({ ...header, status: "draft", created_by: actor.id })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Failed to create quotation");
      qId = data.id;
    }

    const { error: itemErr } = await db.from("quotation_items").insert(items.map((it) => ({ ...it, quotation_id: qId! })));
    if (itemErr) throw itemErr;

    const { error: costErr } = await db.from("quotation_internal_costs").upsert({
      quotation_id: qId,
      manufacturer_cost_total: Math.max(0, Number(input.internal.manufacturer_cost_total) || 0),
      logistics_cost_total: Math.max(0, Number(input.internal.logistics_cost_total) || 0),
      other_internal_costs: Math.max(0, Number(input.internal.other_internal_costs) || 0),
      notes: clean(input.internal.notes ?? "") || null,
    });
    if (costErr) throw costErr;

    await audit({ id: actor.id, email: actor.email }, input.id ? "quotation.updated" : "quotation.created", "quotation", qId);
    revalidateAll(`/admin/quotations`, `/admin/quotations/${qId}`, `/admin/rfqs/${input.rfq_id}`);
    return { ok: true, data: { id: qId } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save quotation." };
  }
}

export async function sendQuotationToClient(quotationId: string): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data: q } = await db
      .from("quotations")
      .select("*, quotation_items(*), rfqs(id,reference,company_name,contact_person,email,phone,project_location,county_country)")
      .eq("id", quotationId)
      .maybeSingle();
    if (!q) return { ok: false, error: "Quotation not found." };

    const items = [...((q.quotation_items ?? []) as { description: string; quantity: number; unit_price: number; sort_order: number }[])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i): QItem => ({ description: i.description, quantity: i.quantity, unit_price: Number(i.unit_price) }));
    if (!items.length) return { ok: false, error: "Quotation has no line items." };

    const rfq = q.rfqs as {
      id: string; reference: string; company_name: string; contact_person: string;
      email: string; phone: string; project_location: string | null; county_country: string | null;
    } | null;

    const nowIso = new Date().toISOString();
    const { error } = await db
      .from("quotations")
      .update({ status: "sent", sent_at: nowIso, client_response_note: null, responded_at: null })
      .eq("id", quotationId);
    if (error) throw error;

    // Store client-facing snapshot ONLY (never internal costs)
    const totals = quoteTotals(items, Number(q.logistics_charge), Number(q.other_charges), Number(q.tax_rate));
    await db.from("quotation_revisions").insert({
      quotation_id: quotationId,
      version: q.version,
      note: `Issued version ${q.version} to client`,
      snapshot: {
        reference: q.reference, version: q.version, currency: q.currency, validity_until: q.validity_until,
        items, totals, delivery_estimate: q.delivery_estimate, incoterm: q.incoterm, payment_terms: q.payment_terms,
      },
      created_by: actor.id,
    });

    if (rfq?.id) await db.from("rfqs").update({ status: "quotation_issued" }).eq("id", rfq.id);

    if (q.client_id) {
      const { data: cl } = await db.from("clients").select("primary_user_id").eq("id", q.client_id).maybeSingle();
      if (cl?.primary_user_id) {
        await db.from("notifications").insert({
          user_id: cl.primary_user_id,
          title: `Quotation ${q.reference} (v${q.version}) issued`,
          body: "Your formal commercial quotation is ready to review and download in the portal.",
          link: `/portal/quotations/${quotationId}`,
        });
      }
    }

    if (rfq?.email) {
      const pdf = await renderQuotationPdf({
        reference: q.reference, version: q.version, status: "sent", currency: q.currency,
        issuedAt: nowIso, validityUntil: q.validity_until, rfqReference: rfq.reference,
        clientCompany: rfq.company_name, clientContact: rfq.contact_person, clientEmail: rfq.email, clientPhone: rfq.phone,
        projectLocation: [rfq.project_location, rfq.county_country].filter(Boolean).join(", ") || null,
        items, logisticsCharge: Number(q.logistics_charge), otherCharges: Number(q.other_charges),
        otherChargesLabel: q.other_charges_label, taxLabel: q.tax_label, taxRate: Number(q.tax_rate),
        incoterm: q.incoterm, deliveryEstimate: q.delivery_estimate, logisticsEstimate: q.logistics_estimate,
        paymentTerms: q.payment_terms, commercialTerms: q.commercial_terms,
      });

      await sendMail({
        to: rfq.email,
        subject: `Commercial Quotation ${q.reference} (v${q.version}) — ProSelect`,
        html: genericAck(
          `Commercial Quotation ${q.reference}`,
          rfq.contact_person,
          [
            `Attached is commercial quotation ${q.reference} (Version ${q.version}) for RFQ ${rfq.reference}.`,
            `You may also review itemised pricing, download the PDF and record your response in the ProSelect Client Portal at ${SITE.url}/portal/quotations/${quotationId}.`,
          ],
        ),
        attachments: [{ filename: `${q.reference}-v${q.version}.pdf`, content: pdf }],
      });
    }

    await audit({ id: actor.id, email: actor.email }, "quotation.sent", "quotation", quotationId, { version: q.version });
    revalidateAll(`/admin/quotations`, `/admin/quotations/${quotationId}`, `/portal/quotations`, `/portal/quotations/${quotationId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not send quotation." };
  }
}

export async function createQuotationRevision(quotationId: string, note: string): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data: q } = await db.from("quotations").select("version").eq("id", quotationId).maybeSingle();
    if (!q) return { ok: false, error: "Quotation not found." };
    const nextVersion = Number(q.version) + 1;
    const { error } = await db
      .from("quotations")
      .update({ version: nextVersion, status: "draft", client_response_note: null, responded_at: null })
      .eq("id", quotationId);
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "quotation.revision_started", "quotation", quotationId, { version: nextVersion, note: clean(note) });
    revalidateAll(`/admin/quotations/${quotationId}`, `/portal/quotations/${quotationId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start revision." };
  }
}

// ----------------------------------------------------------------ORDERS & SHIPMENTS
export async function createOrderFromQuotation(input: {
  quotationId: string;
  title: string;
  delivery_site: string;
  estimated_delivery?: string | null;
}): Promise<AdminResult<{ id: string }>> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data: q } = await db
      .from("quotations")
      .select("*, quotation_items(*), rfqs(id,delivery_destination)")
      .eq("id", input.quotationId)
      .maybeSingle();
    if (!q) return { ok: false, error: "Quotation not found." };
    if (!q.client_id) return { ok: false, error: "Quotation is missing a linked client record." };

    const items = ((q.quotation_items ?? []) as { description: string; quantity: number; unit_price: number }[]).map((i) => ({
      description: i.description, quantity: i.quantity, unit_price: Number(i.unit_price),
    }));
    const totals = quoteTotals(items, Number(q.logistics_charge), Number(q.other_charges), Number(q.tax_rate));

    const { data: order, error } = await db
      .from("orders")
      .insert({
        quotation_id: q.id,
        rfq_id: q.rfq_id,
        client_id: q.client_id,
        stage: "contract_signed",
        title: clean(input.title) || `Order from ${q.reference}`,
        delivery_site: clean(input.delivery_site) || null,
        estimated_delivery: input.estimated_delivery || null,
        value_amount: totals.total,
        currency: q.currency,
        created_by: actor.id,
      })
      .select("id,reference")
      .single();
    if (error || !order) throw error ?? new Error("Failed to create order");

    await db.from("shipment_milestones").insert({
      order_id: order.id,
      stage: "contract_signed",
      note: `Order authorised from commercial quotation ${q.reference}.`,
      visible_to_client: true,
      created_by: actor.id,
    });

    if (q.rfq_id) await db.from("rfqs").update({ status: "won" }).eq("id", q.rfq_id);

    const { data: cl } = await db.from("clients").select("primary_user_id,email,contact_name").eq("id", q.client_id).maybeSingle();
    if (cl?.primary_user_id) {
      await db.from("notifications").insert({
        user_id: cl.primary_user_id,
        title: `Order ${order.reference} confirmed`,
        body: "Your procurement order is now active. Track milestones in Order Tracking.",
        link: `/portal/orders/${order.id}`,
      });
    }
    if (cl?.email) {
      await sendMail({
        to: cl.email,
        subject: `Order ${order.reference} active — ProSelect`,
        html: genericAck(`Order ${order.reference} confirmed`, cl.contact_name ?? "Client", [
          `ProSelect has authorised procurement order ${order.reference} from quotation ${q.reference}.`,
          `You can track every milestone through port clearance and site delivery at ${SITE.url}/portal/orders/${order.id}.`,
        ]),
      });
    }

    await audit({ id: actor.id, email: actor.email }, "order.created", "order", order.id, { quotation: q.reference, reference: order.reference });
    revalidateAll(`/admin/orders`, `/admin/quotations/${q.id}`, `/portal/orders`);
    return { ok: true, data: { id: order.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create order." };
  }
}

export async function updateOrderStage(input: {
  orderId: string;
  stage: string;
  location?: string;
  note?: string;
  estimated_delivery?: string | null;
  visible_to_client: boolean;
  notify_client: boolean;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole([...COMMERCIAL_ROLES, ...OPS_ROLES]);
    if (!ORDER_STAGES.some(([k]) => k === input.stage)) return { ok: false, error: "Invalid procurement stage." };
    const db = createAdminClient();
    const { data: order, error } = await db
      .from("orders")
      .update({
        stage: input.stage,
        ...(input.estimated_delivery !== undefined ? { estimated_delivery: input.estimated_delivery || null } : {}),
      })
      .eq("id", input.orderId)
      .select("id,reference,client_id")
      .single();
    if (error || !order) throw error ?? new Error("Order not found");

    const stageLabel = ORDER_STAGES.find(([k]) => k === input.stage)?.[1] ?? input.stage;
    await db.from("shipment_milestones").insert({
      order_id: order.id,
      stage: input.stage,
      location: clean(input.location ?? "") || null,
      note: clean(input.note ?? "") || null,
      visible_to_client: input.visible_to_client,
      created_by: actor.id,
    });

    if (input.notify_client && input.visible_to_client) {
      const { data: cl } = await db.from("clients").select("primary_user_id,email,contact_name").eq("id", order.client_id).maybeSingle();
      if (cl?.primary_user_id) {
        await db.from("notifications").insert({
          user_id: cl.primary_user_id,
          title: `${order.reference}: ${stageLabel}`,
          body: clean(input.note ?? "") || `Order stage updated to ${stageLabel}.`,
          link: `/portal/orders/${order.id}`,
        });
      }
      if (cl?.email) {
        await sendMail({
          to: cl.email,
          subject: `Shipment update: ${order.reference} — ${stageLabel}`,
          html: genericAck(`Order ${order.reference} milestone update`, cl.contact_name ?? "Client", [
            `Current stage: ${stageLabel}${input.location ? ` (${clean(input.location)})` : ""}.`,
            ...(input.note ? [clean(input.note)] : []),
            `View full timeline and documents at ${SITE.url}/portal/orders/${order.id}.`,
          ]),
        });
      }
    }

    await audit({ id: actor.id, email: actor.email }, "order.stage_updated", "order", order.id, { stage: input.stage });
    revalidateAll(`/admin/orders`, `/admin/orders/${order.id}`, `/portal/orders`, `/portal/orders/${order.id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update order stage." };
  }
}

// ----------------------------------------------------------------DOCUMENTS
const DOC_SIGNATURES: Record<string, { ext: string; magic: number[] }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", magic: [0x50, 0x4b, 0x03, 0x04] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", magic: [0x50, 0x4b, 0x03, 0x04] },
};

export async function uploadClientDocument(fd: FormData): Promise<AdminResult> {
  try {
    const actor = await assertRole(STAFF_ROLES);
    const clientId = String(fd.get("client_id") ?? "").trim();
    const title = clean(String(fd.get("title") ?? ""));
    const docType = String(fd.get("doc_type") ?? "other");
    const rfqId = String(fd.get("rfq_id") ?? "").trim() || null;
    const orderId = String(fd.get("order_id") ?? "").trim() || null;
    const quotationId = String(fd.get("quotation_id") ?? "").trim() || null;
    const visible = fd.get("visible_to_client") === "true";
    const file = fd.get("file");

    if (!clientId) return { ok: false, error: "Client ID is required." };
    if (title.length < 2) return { ok: false, error: "Enter a document title." };
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
    if (file.size > 25 * 1024 * 1024) return { ok: false, error: "File exceeds 25 MB limit." };

    const sig = DOC_SIGNATURES[file.type];
    if (!sig) return { ok: false, error: "Accepted formats: PDF, JPG, PNG, DOCX, XLSX." };
    const buf = Buffer.from(await file.arrayBuffer());
    if (!sig.magic.every((b, i) => buf[i] === b)) return { ok: false, error: "File content does not match its declared format." };

    const db = createAdminClient();
    const path = `${clientId}/${randomUUID()}.${sig.ext}`;
    const { error: upErr } = await db.storage.from("documents").upload(path, buf, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    const { data: doc, error } = await db
      .from("documents")
      .insert({
        client_id: clientId, rfq_id: rfqId, order_id: orderId, quotation_id: quotationId,
        doc_type: docType, title, storage_path: path, mime_type: file.type, size_bytes: file.size,
        visible_to_client: visible, uploaded_by: actor.id,
      })
      .select("id")
      .single();
    if (error || !doc) throw error ?? new Error("Could not save document record");

    if (visible) {
      const { data: cl } = await db.from("clients").select("primary_user_id").eq("id", clientId).maybeSingle();
      if (cl?.primary_user_id) {
        await db.from("notifications").insert({
          user_id: cl.primary_user_id,
          title: `New document: ${title}`,
          body: "Available in your Document Centre.",
          link: "/portal/documents",
        });
      }
    }

    await audit({ id: actor.id, email: actor.email }, "document.uploaded", "document", doc.id, { title, docType, clientId });
    revalidatePath("/admin", "layout"); revalidatePath("/portal", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Document upload failed." };
  }
}

export async function deleteDocument(docId: string): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data: doc } = await db.from("documents").select("id,storage_path,title").eq("id", docId).maybeSingle();
    if (!doc) return { ok: false, error: "Document not found." };
    await db.storage.from("documents").remove([doc.storage_path]);
    await db.from("documents").delete().eq("id", docId);
    await audit({ id: actor.id, email: actor.email }, "document.deleted", "document", docId, { title: doc.title });
    revalidatePath("/admin", "layout"); revalidatePath("/portal", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete document." };
  }
}

// ----------------------------------------------------------------CATALOGUE
export interface SaveProductInput {
  id?: string;
  name: string;
  slug?: string;
  model?: string;
  manufacturer_id?: string | null;
  category_id: string;
  short_description?: string;
  overview?: string;
  performance_info?: string;
  spare_parts_info?: string;
  is_featured: boolean;
  is_sample: boolean;
  status: "draft" | "published" | "archived";
  specs: Spec[];
  configurations: ConfigOption[];
  accessories: ConfigOption[];
}

export async function saveProduct(input: SaveProductInput): Promise<AdminResult<{ id: string; slug: string }>> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const name = clean(input.name);
    if (name.length < 3) return { ok: false, error: "Product name must be at least 3 characters." };
    if (!input.category_id) return { ok: false, error: "Select a product category." };
    const slug = slugify(input.slug || name);
    if (!slug) return { ok: false, error: "Invalid URL slug." };

    const db = createAdminClient();
    const row = {
      name, slug,
      model: clean(input.model ?? "") || null,
      manufacturer_id: input.manufacturer_id || null,
      category_id: input.category_id,
      short_description: clean(input.short_description ?? "") || null,
      overview: clean(input.overview ?? "") || null,
      performance_info: clean(input.performance_info ?? "") || null,
      spare_parts_info: clean(input.spare_parts_info ?? "") || null,
      is_featured: Boolean(input.is_featured),
      is_sample: Boolean(input.is_sample),
      status: input.status,
      configurations: input.configurations.filter((c) => clean(c.name)).map((c) => ({
        name: clean(c.name), description: clean(c.description ?? ""), verified: Boolean(c.verified),
      })),
      accessories: input.accessories.filter((c) => clean(c.name)).map((c) => ({
        name: clean(c.name), description: clean(c.description ?? ""), verified: Boolean(c.verified),
      })),
    };

    let productId: string;
    if (input.id) {
      productId = input.id;
      const { error } = await db.from("products").update(row).eq("id", productId);
      if (error) throw error;
      await db.from("product_specifications").delete().eq("product_id", productId);
    } else {
      const { data, error } = await db.from("products").insert(row).select("id").single();
      if (error || !data) throw error ?? new Error("Failed to create product");
      productId = data.id;
    }

    const cleanSpecs = input.specs
      .filter((s) => clean(s.label).length > 0)
      .map((s, idx) => ({
        product_id: productId!,
        spec_group: clean(s.spec_group || "General") || "General",
        label: clean(s.label),
        value: clean(s.value ?? "") || null,
        unit: clean(s.unit ?? "") || null,
        verification: s.verification === "verified" ? "verified" : "awaiting_confirmation",
        is_key: Boolean(s.is_key),
        sort_order: idx,
      }));
    if (cleanSpecs.length) {
      const { error: specErr } = await db.from("product_specifications").insert(cleanSpecs);
      if (specErr) throw specErr;
    }

    await audit({ id: actor.id, email: actor.email }, input.id ? "product.updated" : "product.created", "product", productId, { slug, status: input.status });
    revalidateAll("/", "/equipment", `/equipment/${slug}`, "/admin/catalogue", `/admin/catalogue/${productId}`);
    return { ok: true, data: { id: productId, slug } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save product.";
    return { ok: false, error: msg.includes("duplicate") ? "Another product already uses this URL slug." : msg };
  }
}

export async function setProductQuickState(
  productId: string,
  patch: { status?: "draft" | "published" | "archived"; is_featured?: boolean },
): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data, error } = await db.from("products").update(patch).eq("id", productId).select("slug").single();
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "product.quick_updated", "product", productId, patch);
    revalidateAll("/", "/equipment", `/equipment/${data.slug}`, "/admin/catalogue");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update product." };
  }
}

const MEDIA_SIGNATURES: Record<string, { ext: string; magic: number[] }> = {
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/webp": { ext: "webp", magic: [0x52, 0x49, 0x46, 0x46] },
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
};

export async function uploadProductMedia(fd: FormData): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const productId = String(fd.get("product_id") ?? "").trim();
    const kind = String(fd.get("kind") ?? "image") as "image" | "brochure" | "compliance";
    const title = clean(String(fd.get("title") ?? "")) || null;
    const altText = clean(String(fd.get("alt_text") ?? "")) || null;
    const isPrimary = fd.get("is_primary") === "true";
    const file = fd.get("file");

    if (!productId) return { ok: false, error: "Save the product first before uploading media." };
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file." };
    if (file.size > 15 * 1024 * 1024) return { ok: false, error: "File exceeds 15 MB limit." };

    const sig = MEDIA_SIGNATURES[file.type];
    if (!sig) return { ok: false, error: "Accepted formats: JPG, PNG, WebP or PDF." };
    if (kind === "image" && file.type === "application/pdf") return { ok: false, error: "Gallery images must be JPG, PNG or WebP." };
    const buf = Buffer.from(await file.arrayBuffer());
    if (!sig.magic.every((b, i) => buf[i] === b)) return { ok: false, error: "Invalid file signature." };

    const db = createAdminClient();
    const path = `${productId}/${randomUUID()}.${sig.ext}`;
    const { error: upErr } = await db.storage.from("product-media").upload(path, buf, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    if (isPrimary && kind === "image") {
      await db.from("product_media").update({ is_primary: false }).eq("product_id", productId).eq("kind", "image");
    }
    const { error } = await db.from("product_media").insert({
      product_id: productId, kind, storage_path: path, title: title ?? file.name.slice(0, 120), alt_text: altText, is_primary: isPrimary,
    });
    if (error) throw error;

    await audit({ id: actor.id, email: actor.email }, "product.media_uploaded", "product", productId, { kind, path });
    revalidateAll("/", "/equipment", `/admin/catalogue/${productId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Media upload failed." };
  }
}

export async function deleteProductMedia(mediaId: string): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data: m } = await db.from("product_media").select("id,product_id,storage_path").eq("id", mediaId).maybeSingle();
    if (!m) return { ok: false, error: "Media not found." };
    if (!m.storage_path.startsWith("/")) await db.storage.from("product-media").remove([m.storage_path]);
    await db.from("product_media").delete().eq("id", mediaId);
    await audit({ id: actor.id, email: actor.email }, "product.media_deleted", "product", m.product_id);
    revalidateAll("/", "/equipment", `/admin/catalogue/${m.product_id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete media." };
  }
}

export async function saveCategory(input: {
  id?: string; name: string; slug?: string; division: Division; description?: string; sort_order?: number;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole(ADMIN_ROLES);
    const name = clean(input.name);
    if (name.length < 2) return { ok: false, error: "Enter a category name." };
    const slug = slugify(input.slug || name);
    const db = createAdminClient();
    const row = { name, slug, division: input.division, description: clean(input.description ?? "") || null, sort_order: Number(input.sort_order) || 0 };
    const { error } = input.id
      ? await db.from("product_categories").update(row).eq("id", input.id)
      : await db.from("product_categories").insert(row);
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, input.id ? "category.updated" : "category.created", "product_category", slug);
    revalidateAll("/equipment", "/solutions", "/admin/catalogue");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save category." };
  }
}

// ----------------------------------------------------------------CLIENTS
export async function updateClientDetails(input: {
  clientId: string;
  organizationId: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  registration_number?: string;
  kra_pin?: string;
  address?: string;
  county?: string;
  country?: string;
  website?: string;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { error: oErr } = await db
      .from("organizations")
      .update({
        name: clean(input.companyName).slice(0, 200),
        registration_number: clean(input.registration_number ?? "") || null,
        kra_pin: clean(input.kra_pin ?? "").toUpperCase() || null,
        address: clean(input.address ?? "") || null,
        county: clean(input.county ?? "") || null,
        country: clean(input.country ?? "Kenya") || "Kenya",
        website: clean(input.website ?? "") || null,
      })
      .eq("id", input.organizationId);
    if (oErr) throw oErr;

    const { error: cErr } = await db
      .from("clients")
      .update({
        contact_name: clean(input.contactName ?? "") || null,
        email: clean(input.email ?? "").toLowerCase() || null,
        phone: clean(input.phone ?? "") || null,
      })
      .eq("id", input.clientId);
    if (cErr) throw cErr;

    await audit({ id: actor.id, email: actor.email }, "client.updated", "client", input.clientId);
    revalidateAll(`/admin/clients`, `/admin/clients/${input.clientId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update client." };
  }
}

// ----------------------------------------------------------------MANUFACTURERS & APPLICATIONS
export async function saveManufacturer(input: {
  id?: string;
  name: string;
  country?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  specializations: string[];
  representation: "prospect" | "in_discussion" | "agreement_pending" | "authorised_representative" | "paused" | "declined";
  commercial_terms?: string;
  assigned_to?: string | null;
  is_sample?: boolean;
}): Promise<AdminResult<{ id: string }>> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const name = clean(input.name);
    if (name.length < 2) return { ok: false, error: "Manufacturer name is required." };
    const db = createAdminClient();
    const row = {
      name,
      country: clean(input.country ?? "") || null,
      contact_person: clean(input.contact_person ?? "") || null,
      email: clean(input.email ?? "").toLowerCase() || null,
      phone: clean(input.phone ?? "") || null,
      website: clean(input.website ?? "") || null,
      specializations: input.specializations.map(clean).filter(Boolean),
      representation: input.representation,
      commercial_terms: clean(input.commercial_terms ?? "") || null,
      assigned_to: input.assigned_to || null,
      is_sample: Boolean(input.is_sample),
    };
    let id: string;
    if (input.id) {
      id = input.id;
      const { error } = await db.from("manufacturers").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("manufacturers").insert(row).select("id").single();
      if (error || !data) throw error ?? new Error("Failed to create manufacturer");
      id = data.id;
    }
    await audit({ id: actor.id, email: actor.email }, input.id ? "manufacturer.updated" : "manufacturer.created", "manufacturer", id);
    revalidateAll("/admin/manufacturers", `/admin/manufacturers/${id}`, "/equipment");
    return { ok: true, data: { id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save manufacturer." };
  }
}

export async function reviewManufacturerApplication(input: {
  applicationId: string;
  status: "submitted" | "under_review" | "more_info_requested" | "approved" | "rejected";
  createDirectoryRecord?: boolean;
  noteToApplicant?: string;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole(COMMERCIAL_ROLES);
    const db = createAdminClient();
    const { data: app } = await db.from("manufacturer_applications").select("*").eq("id", input.applicationId).maybeSingle();
    if (!app) return { ok: false, error: "Application not found." };

    let manufacturerId = app.manufacturer_id as string | null;
    if (input.status === "approved" && input.createDirectoryRecord && !manufacturerId) {
      // Creates an internal Manufacturer Directory entry ONLY — never creates a portal login or exposes client data.
      const { data: created, error: mErr } = await db
        .from("manufacturers")
        .insert({
          name: app.company_name,
          country: app.country_of_manufacture,
          contact_person: app.contact_person,
          email: app.email,
          phone: app.phone,
          website: app.website,
          specializations: app.product_categories ?? [],
          representation: "in_discussion",
          assigned_to: actor.id,
        })
        .select("id")
        .single();
      if (mErr) throw mErr;
      manufacturerId = created.id;
    }

    const { error } = await db
      .from("manufacturer_applications")
      .update({ status: input.status, manufacturer_id: manufacturerId, reviewed_by: actor.id })
      .eq("id", input.applicationId);
    if (error) throw error;

    if (input.noteToApplicant && clean(input.noteToApplicant).length > 3) {
      await sendMail({
        to: app.email,
        subject: `Update on your ProSelect partnership application (${app.reference})`,
        html: genericAck(`Application ${app.reference} — ${input.status.replace(/_/g, " ")}`, app.contact_person, [
          clean(input.noteToApplicant),
        ]),
      });
    }

    await audit({ id: actor.id, email: actor.email }, "manufacturer_application.reviewed", "manufacturer_application", app.id, {
      status: input.status, manufacturerId,
    });
    revalidateAll("/admin/applications", `/admin/applications/${app.id}`, "/admin/manufacturers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update application." };
  }
}

// ----------------------------------------------------------------LEADS, CMS SETTINGS & STAFF ROLES
export async function updateLeadStatus(input: {
  leadId: string;
  status: "new" | "contacted" | "qualified" | "converted" | "closed";
  assigned_to?: string | null;
}): Promise<AdminResult> {
  try {
    const actor = await assertRole(STAFF_ROLES);
    const db = createAdminClient();
    const { error } = await db
      .from("leads")
      .update({ status: input.status, assigned_to: input.assigned_to || null })
      .eq("id", input.leadId);
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "lead.updated", "lead", input.leadId, { status: input.status });
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update lead." };
  }
}

export async function saveSiteSettings(settings: Record<string, unknown>): Promise<AdminResult> {
  try {
    const actor = await assertRole(ADMIN_ROLES);
    const allowedKeys = [
      "contact.phone", "contact.email", "contact.location", "contact.map_embed_url",
      "whatsapp.enabled", "whatsapp.number", "whatsapp.message", "social.linkedin",
    ];
    const mapUrl = String(settings["contact.map_embed_url"] ?? "").trim();
    if (
      mapUrl &&
      !mapUrl.startsWith("https://www.google.com/maps/embed") &&
      !mapUrl.startsWith("https://www.openstreetmap.org/export/embed")
    ) {
      return { ok: false, error: "Map embed URL must be an official Google Maps or OpenStreetMap https embed URL (or left blank until address is confirmed)." };
    }

    const rows = allowedKeys
      .filter((k) => k in settings)
      .map((key) => ({ key, value: settings[key], is_public: true, updated_at: new Date().toISOString() }));

    const db = createAdminClient();
    const { error } = await db.from("site_settings").upsert(rows);
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "site_settings.updated", "site_settings", "public");
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save settings." };
  }
}

export async function updateUserRole(input: { profileId: string; role: Role; is_active: boolean }): Promise<AdminResult> {
  try {
    const actor = await assertRole(ADMIN_ROLES);
    if (input.profileId === actor.id && (!input.is_active || !ADMIN_ROLES.includes(input.role))) {
      return { ok: false, error: "You cannot remove your own administrator access." };
    }
    if (input.role === "super_admin" && actor.role !== "super_admin") {
      return { ok: false, error: "Only a Super Administrator can grant the Super Administrator role." };
    }
    const db = createAdminClient();
    const { error } = await db
      .from("profiles")
      .update({ role: input.role, is_active: input.is_active })
      .eq("id", input.profileId);
    if (error) throw error;
    await audit({ id: actor.id, email: actor.email }, "profile.role_updated", "profile", input.profileId, {
      role: input.role, is_active: input.is_active,
    });
    revalidatePath("/admin/audit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update user role." };
  }
}

