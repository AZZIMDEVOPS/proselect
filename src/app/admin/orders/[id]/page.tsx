import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KV, OrderTimeline, PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { OrderMilestoneRecorder } from "@/components/admin/order-admin-widgets";
import { AdminDocumentManager, InternalNotesPanel } from "@/components/admin/notes-and-docs";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES, OPS_ROLES } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Order & Shipment" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff([...COMMERCIAL_ROLES, ...OPS_ROLES]);
  const db = createAdminClient();

  const { data: order } = await db
    .from("orders")
    .select("*, quotations(id,reference), rfqs(id,reference,company_name), clients(id,contact_name,email,phone,organizations(name))")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const [msRes, docsRes, notesRes] = await Promise.all([
    db.from("shipment_milestones").select("id,stage,note,location,occurred_at,visible_to_client").eq("order_id", id).order("occurred_at", { ascending: true }),
    db.from("documents").select("id,title,doc_type,visible_to_client,created_at").eq("order_id", id).order("created_at", { ascending: false }),
    db.from("internal_notes").select("id,body,created_at").eq("entity_type", "order").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);

  const quote = order.quotations as { id: string; reference: string } | null;
  const rfq = order.rfqs as { id: string; reference: string; company_name: string } | null;
  const client = order.clients as {
    id: string; contact_name: string | null; email: string | null; phone: string | null;
    organizations: { name: string } | null;
  } | null;

  return (
    <>
      <PageHeading
        title={`${order.reference}${order.title ? ` — ${order.title}` : ""}`}
        actions={<StatusBadge s={order.stage} />}
      >
        Client: {client?.organizations?.name ?? rfq?.company_name ?? "Client"} · Last updated {formatDate(order.updated_at, true)}
      </PageHeading>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Panel title="12-Stage Procurement & Shipment Timeline">
            <OrderTimeline stage={order.stage} milestones={msRes.data ?? []} />
          </Panel>

          <Panel title="Order & Commercial Details">
            <KV
              rows={[
                ["Client company", client ? <Link key="c" href={`/admin/clients/${client.id}`} className="font-semibold text-[#00447B] hover:underline">{client.organizations?.name ?? client.contact_name}</Link> : rfq?.company_name],
                ["Client contact", [client?.contact_name, client?.email, client?.phone].filter(Boolean).join(" · ")],
                ["Delivery site", order.delivery_site],
                ["Estimated delivery", formatDate(order.estimated_delivery)],
                ["Contract value", order.value_amount != null ? formatMoney(order.value_amount, order.currency ?? "USD") : null],
                ["Source quotation", quote ? <Link key="q" href={`/admin/quotations/${quote.id}`} className="font-semibold text-[#00447B] hover:underline">{quote.reference}</Link> : null],
                ["Source RFQ", rfq ? <Link key="r" href={`/admin/rfqs/${rfq.id}`} className="font-semibold text-[#00447B] hover:underline">{rfq.reference}</Link> : null],
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Update Stage & Record Shipment Milestone">
            <OrderMilestoneRecorder
              orderId={order.id}
              currentStage={order.stage}
              estimatedDelivery={order.estimated_delivery}
            />
          </Panel>

          <Panel title="Shipping, Port Clearance & Contract Documents">
            <AdminDocumentManager clientId={order.client_id} orderId={order.id} documents={docsRes.data ?? []} />
          </Panel>

          <Panel title="Internal Operations Notes">
            <InternalNotesPanel entityType="order" entityId={order.id} notes={notesRes.data ?? []} />
          </Panel>
        </div>
      </div>
    </>
  );
}

