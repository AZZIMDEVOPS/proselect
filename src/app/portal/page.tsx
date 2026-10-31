import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading, Panel, StatCard, StatusBadge } from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

const ACTIVE_RFQ = ["received", "technical_review", "manufacturer_engagement", "quotation_issued", "negotiation"];

export default async function PortalHome() {
  const s = await requireClient();
  const sb = await createClient();
  const [rfqs, quotes, orders, notes] = await Promise.all([
    sb.from("rfqs").select("id,reference,status,created_at,updated_at,company_name").order("updated_at", { ascending: false }).limit(50),
    sb.from("quotations").select("id,reference,status,sent_at,updated_at,rfq_id").order("updated_at", { ascending: false }).limit(50),
    sb.from("orders").select("id,reference,stage,title,updated_at").order("updated_at", { ascending: false }).limit(50),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const r = rfqs.data ?? [], q = quotes.data ?? [], o = orders.data ?? [];
  const activity = [
    ...r.map((x) => ({ at: x.updated_at, text: `Inquiry ${x.reference}`, status: x.status, href: `/portal/inquiries/${x.id}` })),
    ...q.map((x) => ({ at: x.updated_at, text: `Quotation ${x.reference}`, status: x.status, href: `/portal/quotations/${x.id}` })),
    ...o.map((x) => ({ at: x.updated_at, text: `Order ${x.reference}`, status: x.stage, href: `/portal/orders/${x.id}` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6);

  return (
    <>
      <PageHeading title={`Welcome, ${s.full_name?.split(" ")[0] ?? "there"}`} actions={<Button asChild><Link href="/rfq">New request for quotation</Link></Button>}>
        {s.company} · Here is where your procurement activity stands.
      </PageHeading>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active RFQs" value={r.filter((x) => ACTIVE_RFQ.includes(x.status)).length} href="/portal/inquiries" />
        <StatCard title="Pending quotations" value={q.filter((x) => x.status === "sent").length} hint="Awaiting your response" href="/portal/quotations" accent />
        <StatCard title="Approved quotations" value={q.filter((x) => x.status === "accepted").length} href="/portal/quotations" />
        <StatCard title="Active orders" value={o.filter((x) => x.stage !== "completed").length} href="/portal/orders" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent notifications" actions={<Link href="/portal/notifications" className="text-sm font-semibold text-[#00447B]">View all</Link>}>
          {(notes.data ?? []).length === 0 ? <p className="text-sm text-steel-600">No notifications yet.</p> : (
            <ul className="divide-y divide-steel-100">{notes.data!.map((n) => (
              <li key={n.id} className="py-3"><Link href={n.link ?? "/portal/notifications"} className="block"><p className={`text-sm ${n.read_at ? "" : "font-bold"}`}>{n.title}</p>{n.body && <p className="text-xs text-steel-600">{n.body}</p>}<p className="mt-0.5 text-[11px] text-steel-400">{formatDate(n.created_at, true)}</p></Link></li>))}</ul>
          )}
        </Panel>
        <Panel title="Recent activity">
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" action={<Button asChild><Link href="/rfq">Submit your first RFQ <ArrowRight /></Link></Button>}>Your inquiries, quotations and orders will appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-steel-100">{activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3"><Link href={a.href} className="min-w-0"><p className="truncate text-sm font-semibold hover:text-[#00447B]">{a.text}</p><p className="text-[11px] text-steel-500">{formatDate(a.at, true)}</p></Link><StatusBadge s={a.status} /></li>))}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}

