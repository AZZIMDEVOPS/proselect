import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, StatusBadge } from "@/components/dashboard/parts";
import { EmptyState } from "@/components/ui/card";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STAGES } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Tracking" };

export default async function PortalOrdersPage() {
  await requireClient();
  const sb = await createClient();
  const { data } = await sb
    .from("orders")
    .select("id,reference,title,stage,delivery_site,estimated_delivery,value_amount,currency,updated_at")
    .order("updated_at", { ascending: false });

  return (
    <>
      <PageHeading title="Order Tracking">
        Follow your confirmed procurement orders from contract signing through international transit, port clearance and site delivery.
      </PageHeading>
      {!data?.length ? (
        <EmptyState title="No confirmed orders yet">
          Once a quotation is approved and contractual workflows are authorised by ProSelect, your order and live shipment milestones appear here.
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {data.map((o) => {
            const idx = Math.max(0, ORDER_STAGES.findIndex(([k]) => k === o.stage));
            const pct = Math.round(((idx + 1) / ORDER_STAGES.length) * 100);
            const stageLabel = ORDER_STAGES[idx]?.[1] ?? o.stage;
            return (
              <Link
                key={o.id}
                href={`/portal/orders/${o.id}`}
                className="block rounded-xl border border-steel-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-[#00447B] hover:shadow-lift"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-extrabold text-navy-900">
                      {o.reference}{o.title ? ` — ${o.title}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-steel-500">
                      {o.delivery_site ? `Destination: ${o.delivery_site} · ` : ""}
                      {o.estimated_delivery ? `Est. delivery: ${formatDate(o.estimated_delivery)} · ` : ""}
                      Updated {formatDate(o.updated_at, true)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {o.value_amount != null && (
                      <span className="text-sm font-bold text-navy-900">{formatMoney(o.value_amount, o.currency ?? "USD")}</span>
                    )}
                    <StatusBadge s={o.stage} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-steel-600">
                    <span>Stage {idx + 1} of {ORDER_STAGES.length}: {stageLabel}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-steel-100" aria-hidden>
                    <div className="h-full rounded-full bg-[#00447B] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

