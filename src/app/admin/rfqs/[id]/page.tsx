import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { KV, PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { MessageThread } from "@/components/dashboard/interactive";
import { ManufacturerEngagementForm, RfqWorkflowForm } from "@/components/admin/rfq-admin-widgets";
import { AdminDocumentManager, InternalNotesPanel } from "@/components/admin/notes-and-docs";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { STAFF_ROLES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "RFQ Details" };

export default async function AdminRfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const db = createAdminClient();

  const { data: rfq } = await db
    .from("rfqs")
    .select("*, rfq_items(*, products(id,name,slug))")
    .eq("id", id)
    .maybeSingle();
  if (!rfq) notFound();

  const [staffRes, mfrsRes, engRes, notesRes, msgsRes, docsRes, quotesRes] = await Promise.all([
    db.from("profiles").select("id,full_name,email,role").in("role", STAFF_ROLES).eq("is_active", true),
    db.from("manufacturers").select("id,name,country").order("name"),
    db.from("manufacturer_engagements").select("id,status,note,follow_up_at,created_at,manufacturers(id,name,country)").eq("rfq_id", id).order("created_at", { ascending: false }),
    db.from("internal_notes").select("id,body,created_at,author_id").eq("entity_type", "rfq").eq("entity_id", id).order("created_at", { ascending: false }),
    db.from("messages").select("id,body,from_staff,created_at").eq("rfq_id", id).order("created_at"),
    db.from("documents").select("id,title,doc_type,visible_to_client,created_at").eq("rfq_id", id).order("created_at", { ascending: false }),
    db.from("quotations").select("id,reference,version,status,currency,created_at").eq("rfq_id", id).order("version", { ascending: false }),
  ]);

  const staffMap = new Map((staffRes.data ?? []).map((s) => [s.id, s.full_name || s.email]));
  const items = (rfq.rfq_items ?? []) as {
    id: string; quantity: number; custom_description: string | null; category_label: string | null;
    model: string | null; preferred_manufacturer: string | null; specifications: string | null;
    power_requirements: string | null; accessories: string | null; spare_parts: string | null;
    maintenance: string | null; custom_configuration: string | null;
    products: { id: string; name: string; slug: string } | null;
  }[];

  return (
    <>
      <PageHeading
        title={`${rfq.reference} — ${rfq.company_name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge s={rfq.status} />
            <Button asChild size="sm">
              <Link href={`/admin/quotations/new?rfq=${rfq.id}`}><FilePlus2 /> Generate quotation</Link>
            </Button>
          </div>
        }
      >
        Received {formatDate(rfq.created_at, true)} · Contact: {rfq.contact_person} ({rfq.email} · {rfq.phone})
      </PageHeading>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Panel title="Technical & Equipment Requirements">
            <ul className="divide-y divide-steel-100">
              {items.map((it, idx) => (
                <li key={it.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-base font-bold text-navy-900">
                    Item {idx + 1}: {it.quantity} ×{" "}
                    {it.products ? (
                      <Link href={`/equipment/${it.products.slug}`} className="text-[#00447B] hover:underline">
                        {it.products.name}
                      </Link>
                    ) : (
                      "Custom equipment inquiry"
                    )}
                  </p>
                  <div className="mt-2">
                    <KV
                      rows={[
                        ["Category", it.category_label],
                        ["Custom description", it.custom_description],
                        ["Model", it.model],
                        ["Preferred manufacturer", it.preferred_manufacturer],
                        ["Specifications", it.specifications],
                        ["Power / battery", it.power_requirements],
                        ["Accessories", it.accessories],
                        ["Spare parts", it.spare_parts],
                        ["Maintenance", it.maintenance],
                        ["Custom configuration", it.custom_configuration],
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Project & Delivery Details">
            <KV
              rows={[
                ["Company", rfq.company_name],
                ["Contact person", rfq.contact_person],
                ["Email", <a key="e" href={`mailto:${rfq.email}`} className="text-[#00447B] underline">{rfq.email}</a>],
                ["Phone", rfq.phone],
                ["Project location", [rfq.project_location, rfq.county_country].filter(Boolean).join(", ")],
                ["Intended application", rfq.intended_application],
                ["Timeline", rfq.procurement_timeline],
                ["Delivery destination", rfq.delivery_destination],
                ["Delivery arrangement", rfq.delivery_arrangement],
                ["Site accessibility", rfq.site_accessibility],
                ["Logistics support", rfq.logistics_support],
                ["Additional requirements", rfq.additional_requirements],
              ]}
            />
          </Panel>

          <Panel title="Manufacturer Engagement Log">
            <div className="space-y-4">
              {(engRes.data ?? []).length > 0 && (
                <ul className="space-y-2.5">
                  {(engRes.data ?? []).map((e) => {
                    const m = e.manufacturers as unknown as { id: string; name: string; country: string | null } | null;
                    return (
                      <li key={e.id} className="rounded-lg border border-steel-200 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link href={m ? `/admin/manufacturers/${m.id}` : "#"} className="font-bold text-navy-900 hover:text-[#00447B]">
                            {m?.name ?? "Manufacturer"}{m?.country ? ` (${m.country})` : ""}
                          </Link>
                          <StatusBadge s={e.status} />
                        </div>
                        {e.note && <p className="mt-1 text-steel-600">{e.note}</p>}
                        <p className="mt-1 text-xs text-steel-500">
                          Logged {formatDate(e.created_at, true)}
                          {e.follow_up_at ? ` · Follow-up: ${formatDate(e.follow_up_at)}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <ManufacturerEngagementForm rfqId={id} manufacturers={mfrsRes.data ?? []} />
            </div>
          </Panel>

          <Panel title="Client Message Thread">
            <MessageThread rfqId={id} viewer="staff" messages={(msgsRes.data ?? []).map((m) => ({ ...m, sender: rfq.contact_person }))} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Workflow & Assignment">
            <RfqWorkflowForm
              rfqId={id}
              initialStatus={rfq.status}
              initialAssignedTo={rfq.assigned_to}
              initialFollowUp={rfq.follow_up_at}
              staff={(staffRes.data ?? []).map((s) => ({ id: s.id, label: `${s.full_name || s.email} (${s.role.replace(/_/g, " ")})` }))}
            />
          </Panel>

          <Panel
            title="Quotations for this RFQ"
            actions={<Link href={`/admin/quotations/new?rfq=${rfq.id}`} className="text-xs font-bold text-[#00447B] hover:underline">+ New quotation</Link>}
          >
            {(quotesRes.data ?? []).length === 0 ? (
              <p className="text-sm text-steel-600">No quotations created yet.</p>
            ) : (
              <ul className="space-y-2">
                {(quotesRes.data ?? []).map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/quotations/${q.id}`} className="flex items-center justify-between rounded-md border border-steel-200 p-3 text-sm hover:border-[#00447B]">
                      <span className="font-bold text-navy-900">{q.reference} · v{q.version}</span>
                      <StatusBadge s={q.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Supporting Documents">
            <AdminDocumentManager clientId={rfq.client_id} rfqId={id} documents={docsRes.data ?? []} />
          </Panel>

          <Panel title="Internal Notes">
            <InternalNotesPanel
              entityType="rfq"
              entityId={id}
              notes={(notesRes.data ?? []).map((n) => ({
                id: n.id, body: n.body, created_at: n.created_at,
                author_name: n.author_id ? staffMap.get(n.author_id) ?? "Staff" : "Staff",
              }))}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}

