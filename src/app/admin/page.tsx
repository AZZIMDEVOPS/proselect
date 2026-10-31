import Link from "next/link";
import { PageHeading, Panel, StatCard, StatusBadge } from "@/components/dashboard/parts";
import { MonthlyInquiriesChart, PipelineStageChart } from "@/components/admin/analytics-charts";
import { Button } from "@/components/ui/button";
import { SetupNotice } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { quoteTotals } from "@/lib/quote";
import { RFQ_STATUS_LABEL } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

const SHIPMENT_STAGES = ["factory_dispatch", "international_transit", "port_clearance", "site_delivery"];

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  await requireStaff();
  const sp = await searchParams;

  if (!isServiceRoleConfigured()) {
    return <SetupNotice what="The Admin Command Centre" />;
  }

  const db = createAdminClient();
  const [rfqsRes, quotesRes, ordersRes, leadsRes, appsRes] = await Promise.all([
    db.from("rfqs").select("id,reference,company_name,status,category,created_at,updated_at").order("created_at", { ascending: false }).limit(500),
    db.from("quotations").select("id,reference,status,currency,tax_rate,logistics_charge,other_charges,updated_at,quotation_items(quantity,unit_price)").order("updated_at", { ascending: false }).limit(300),
    db.from("orders").select("id,reference,title,stage,value_amount,currency,updated_at").order("updated_at", { ascending: false }).limit(300),
    db.from("leads").select("id,reference,name,company,status,created_at").order("created_at", { ascending: false }).limit(300),
    db.from("manufacturer_applications").select("id,reference,company_name,status,created_at").order("created_at", { ascending: false }).limit(100),
  ]);

  const rfqs = rfqsRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const apps = appsRes.data ?? [];

  const totalInquiries = rfqs.length + leads.length;
  const newRfqs = rfqs.filter((r) => r.status === "received").length;
  const pendingDraftQuotes = quotes.filter((q) => q.status === "draft").length;
  const awaitingResponseQuotes = quotes.filter((q) => q.status === "sent").length;
  const activeNegotiations =
    rfqs.filter((r) => r.status === "negotiation").length +
    quotes.filter((q) => q.status === "revision_requested").length;
  const confirmedOrders = orders.length;
  const activeShipments = orders.filter((o) => SHIPMENT_STAGES.includes(o.stage)).length;

  // Verified pipeline value: sum of active issued/accepted quotations by currency (never invented).
  const pipelineByCurrency = new Map<string, number>();
  for (const q of quotes.filter((x) => x.status === "sent" || x.status === "accepted" || x.status === "revision_requested")) {
    const items = ((q.quotation_items ?? []) as { quantity: number; unit_price: number }[]).map((i) => ({
      description: "", quantity: i.quantity, unit_price: Number(i.unit_price),
    }));
    const t = quoteTotals(items, Number(q.logistics_charge), Number(q.other_charges), Number(q.tax_rate));
    pipelineByCurrency.set(q.currency, (pipelineByCurrency.get(q.currency) ?? 0) + t.total);
  }
  const pipelineDisplay =
    pipelineByCurrency.size === 0
      ? "No open quotes"
      : [...pipelineByCurrency.entries()].map(([ccy, amt]) => formatMoney(amt, ccy)).join(" · ");

  // Build 6-month trend buckets
  const now = new Date();
  const months: { key: string; month: string; rfqs: number; leads: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-KE", { month: "short", year: "2-digit" });
    months.push({ key, month: label, rfqs: 0, leads: 0 });
  }
  const mMap = new Map(months.map((m) => [m.key, m]));
  for (const r of rfqs) {
    const k = r.created_at.slice(0, 7);
    if (mMap.has(k)) mMap.get(k)!.rfqs += 1;
  }
  for (const l of leads) {
    const k = l.created_at.slice(0, 7);
    if (mMap.has(k)) mMap.get(k)!.leads += 1;
  }

  const stageCounts = ["received", "technical_review", "manufacturer_engagement", "quotation_issued", "negotiation", "won"].map((st) => ({
    stage: (RFQ_STATUS_LABEL[st] ?? st).split(" ")[0],
    count: rfqs.filter((r) => r.status === st).length,
  }));

  const recentActivity = [
    ...rfqs.slice(0, 8).map((r) => ({ at: r.updated_at, kind: "RFQ", label: `${r.reference} — ${r.company_name}`, status: r.status, href: `/admin/rfqs/${r.id}` })),
    ...quotes.slice(0, 6).map((q) => ({ at: q.updated_at, kind: "Quotation", label: q.reference, status: q.status, href: `/admin/quotations/${q.id}` })),
    ...orders.slice(0, 6).map((o) => ({ at: o.updated_at, kind: "Order", label: `${o.reference}${o.title ? ` — ${o.title}` : ""}`, status: o.stage, href: `/admin/orders/${o.id}` })),
    ...apps.slice(0, 4).map((a) => ({ at: a.created_at, kind: "Partner App", label: `${a.reference} — ${a.company_name}`, status: a.status, href: `/admin/applications/${a.id}` })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 10);

  return (
    <>
      {sp.denied && (
        <div role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Your role does not permit access to that administrative section.
        </div>
      )}
      <PageHeading
        title="Operational Overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/admin/catalogue/new">Add equipment</Link></Button>
            <Button asChild size="sm"><Link href="/admin/rfqs">Review incoming RFQs</Link></Button>
          </div>
        }
      >
        Live procurement pipeline, quotation workflow, manufacturer representation and shipment milestones.
      </PageHeading>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total inquiries" value={totalInquiries} hint={`${rfqs.length} RFQs · ${leads.length} contact leads`} href="/admin/rfqs" />
        <StatCard title="New RFQs" value={newRfqs} hint="Awaiting technical review" href="/admin/rfqs" accent={newRfqs > 0} />
        <StatCard title="Pending draft quotes" value={pendingDraftQuotes} hint="In preparation" href="/admin/quotations" />
        <StatCard title="Awaiting client response" value={awaitingResponseQuotes} hint="Issued quotations" href="/admin/quotations" accent={awaitingResponseQuotes > 0} />
        <StatCard title="Active negotiations" value={activeNegotiations} hint="Negotiation / revision requested" href="/admin/quotations" />
        <StatCard title="Confirmed orders" value={confirmedOrders} hint="Authorised contracts" href="/admin/orders" />
        <StatCard title="Active shipments" value={activeShipments} hint="Dispatch to site delivery" href="/admin/orders" />
        <StatCard title="Verified quote pipeline" value={<span className="text-xl">{pipelineDisplay}</span>} hint="Open issued & accepted quotes" href="/admin/quotations" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Monthly inquiry trends (last 6 months)">
          <MonthlyInquiriesChart data={months} />
        </Panel>
        <Panel title="RFQ pipeline by stage">
          <PipelineStageChart data={stageCounts} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Recent operational activity">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-steel-600">No operational activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-steel-100">
              {recentActivity.map((a, idx) => (
                <li key={idx} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={a.href} className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900 hover:text-[#00447B]">
                      <span className="mr-2 rounded bg-steel-100 px-2 py-0.5 text-[11px] font-bold uppercase text-steel-600">{a.kind}</span>
                      {a.label}
                    </p>
                    <p className="mt-0.5 text-xs text-steel-500">{formatDate(a.at, true)}</p>
                  </Link>
                  <StatusBadge s={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

