import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { KV, OrderTimeline, PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPE_LABEL } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Order & Shipment Tracking" };

export default async function PortalOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireClient();
  const sb = await createClient();
  const { data: order } = await sb
    .from("orders")
    .select("*, quotations(id,reference), rfqs(id,reference)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const [msRes, docRes] = await Promise.all([
    sb.from("shipment_milestones").select("stage,note,location,occurred_at").eq("order_id", id).order("occurred_at", { ascending: true }),
    sb.from("documents").select("id,title,doc_type,created_at").eq("order_id", id).order("created_at", { ascending: false }),
  ]);

  const quote = order.quotations as { id: string; reference: string } | null;
  const rfq = order.rfqs as { id: string; reference: string } | null;

  return (
    <>
      <PageHeading
        title={`${order.reference}${order.title ? ` — ${order.title}` : ""}`}
        actions={<StatusBadge s={order.stage} />}
      >
        All procurement and shipment milestones are verified and updated by authorised ProSelect operations staff.
      </PageHeading>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Procurement & Shipment Timeline">
          <OrderTimeline stage={order.stage} milestones={msRes.data ?? []} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Order summary">
            <KV
              rows={[
                ["Order reference", order.reference],
                ["Delivery site", order.delivery_site],
                ["Estimated delivery", formatDate(order.estimated_delivery)],
                ["Contract value", order.value_amount != null ? formatMoney(order.value_amount, order.currency ?? "USD") : null],
                [
                  "Source quotation",
                  quote ? (
                    <Link key="q" href={`/portal/quotations/${quote.id}`} className="font-semibold text-[#00447B] hover:underline">
                      {quote.reference}
                    </Link>
                  ) : null,
                ],
                [
                  "Original RFQ",
                  rfq ? (
                    <Link key="r" href={`/portal/inquiries/${rfq.id}`} className="font-semibold text-[#00447B] hover:underline">
                      {rfq.reference}
                    </Link>
                  ) : null,
                ],
                ["Last updated", formatDate(order.updated_at, true)],
              ]}
            />
          </Panel>

          <Panel title="Order & shipping documents">
            {docRes.data?.length ? (
              <ul className="space-y-2">
                {docRes.data.map((d) => (
                  <li key={d.id}>
                    <a
                      href={`/api/documents/${d.id}`}
                      className="flex items-center gap-3 rounded-md border border-steel-200 p-3 text-sm transition hover:border-[#00447B]"
                    >
                      <Download className="size-4 shrink-0 text-[#00447B]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-navy-900">{d.title}</p>
                        <p className="text-xs text-steel-500">
                          {DOC_TYPE_LABEL[d.doc_type] ?? d.doc_type} · {formatDate(d.created_at)}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-steel-600">
                Commercial invoices, sales contracts, compliance certificates and shipping documents will appear here as they are uploaded by ProSelect.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

