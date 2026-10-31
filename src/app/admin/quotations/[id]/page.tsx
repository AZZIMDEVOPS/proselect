import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading, Panel } from "@/components/dashboard/parts";
import { QuotationBuilder } from "@/components/admin/quotation-builder";
import { InternalNotesPanel } from "@/components/admin/notes-and-docs";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Quotation" };

export default async function AdminQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();

  const { data: q } = await db
    .from("quotations")
    .select("*, quotation_items(*), quotation_internal_costs(*), quotation_revisions(*), rfqs(id,reference,company_name,contact_person,delivery_destination,project_location)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const [{ data: products }, { data: orders }, { data: notes }] = await Promise.all([
    db.from("products").select("id,name,model").neq("status", "archived").order("name"),
    db.from("orders").select("id,reference,stage").eq("quotation_id", id),
    db.from("internal_notes").select("id,body,created_at").eq("entity_type", "quotation").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);

  const rfq = q.rfqs as {
    id: string; reference: string; company_name: string; contact_person: string;
    delivery_destination: string | null; project_location: string | null;
  } | null;

  const items = [...((q.quotation_items ?? []) as { product_id: string | null; description: string; quantity: number; unit_price: number; sort_order: number }[])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ product_id: i.product_id, description: i.description, quantity: i.quantity, unit_price: Number(i.unit_price) }));

  const icRaw = q.quotation_internal_costs as
    | { manufacturer_cost_total: number; logistics_cost_total: number; other_internal_costs: number; notes: string | null }
    | { manufacturer_cost_total: number; logistics_cost_total: number; other_internal_costs: number; notes: string | null }[]
    | null;
  const ic = Array.isArray(icRaw) ? icRaw[0] : icRaw;

  const revisions = [...((q.quotation_revisions ?? []) as { id: string; version: number; note: string | null; created_at: string }[])].sort(
    (a, b) => b.version - a.version,
  );

  return (
    <>
      <PageHeading title={`${q.reference} · v${q.version}`}>
        {rfq ? (
          <>
            Client: <strong>{rfq.company_name}</strong> · Linked RFQ:{" "}
            <Link href={`/admin/rfqs/${rfq.id}`} className="font-semibold text-[#00447B] hover:underline">{rfq.reference}</Link>
          </>
        ) : (
          "Commercial quotation"
        )}
        {q.client_response_note && ` · Client note: “${q.client_response_note}”`}
      </PageHeading>

      <QuotationBuilder
        catalogue={products ?? []}
        status={q.status}
        version={q.version}
        reference={q.reference}
        defaultOrderTitle={`${rfq?.company_name ?? "Client"} — ${q.reference}`}
        defaultDeliverySite={rfq?.delivery_destination ?? rfq?.project_location ?? "Nairobi, Kenya"}
        existingOrders={orders ?? []}
        initial={{
          id: q.id,
          rfq_id: q.rfq_id,
          currency: q.currency,
          validity_until: q.validity_until,
          delivery_estimate: q.delivery_estimate ?? "",
          logistics_estimate: q.logistics_estimate ?? "",
          incoterm: q.incoterm ?? "",
          payment_terms: q.payment_terms ?? "",
          commercial_terms: q.commercial_terms ?? "",
          tax_label: q.tax_label ?? "VAT",
          tax_rate: Number(q.tax_rate ?? 0),
          logistics_charge: Number(q.logistics_charge ?? 0),
          other_charges: Number(q.other_charges ?? 0),
          other_charges_label: q.other_charges_label ?? "",
          items: items.length ? items : [{ product_id: null, description: "", quantity: 1, unit_price: 0 }],
          internal: {
            manufacturer_cost_total: Number(ic?.manufacturer_cost_total ?? 0),
            logistics_cost_total: Number(ic?.logistics_cost_total ?? 0),
            other_internal_costs: Number(ic?.other_internal_costs ?? 0),
            notes: ic?.notes ?? "",
          },
        }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Issued Revision History">
          {revisions.length === 0 ? (
            <p className="text-sm text-steel-600">Snapshots appear here each time a quotation version is issued to the client.</p>
          ) : (
            <ul className="divide-y divide-steel-100 text-sm">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5">
                  <span className="font-semibold text-navy-900">Version v{r.version}{r.note ? ` — ${r.note}` : ""}</span>
                  <span className="text-xs text-steel-500">{formatDate(r.created_at, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Internal Quotation Notes">
          <InternalNotesPanel entityType="quotation" entityId={id} notes={notes ?? []} />
        </Panel>
      </div>
    </>
  );
}

