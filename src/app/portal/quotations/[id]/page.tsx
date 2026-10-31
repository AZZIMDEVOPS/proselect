import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { KV, PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { QuotationResponse } from "@/components/dashboard/interactive";
import { Button } from "@/components/ui/button";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { quoteTotals } from "@/lib/quote";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireClient();
  const sb = await createClient();
  // RLS: only this client's non-draft quotations are visible. Internal cost data is in a staff-only table and is never selected here.
  const { data: q } = await sb.from("quotations").select("*, quotation_items(*)").eq("id", id).maybeSingle();
  if (!q) notFound();
  const items = [...(q.quotation_items as { id: string; description: string; quantity: number; unit_price: number; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order);
  const t = quoteTotals(items.map((i) => ({ ...i, unit_price: Number(i.unit_price) })), Number(q.logistics_charge), Number(q.other_charges), Number(q.tax_rate));
  const expired = q.validity_until && new Date(q.validity_until) < new Date(new Date().toDateString());
  const m = (n: number) => formatMoney(n, q.currency);
  return (
    <>
      <PageHeading title={`${q.reference} · v${q.version}`} actions={<div className="flex items-center gap-3"><StatusBadge s={q.status} /><Button asChild variant="outline" size="sm"><a href={`/api/quotations/${q.id}/pdf`}><Download /> Download PDF</a></Button></div>}>
        Issued {formatDate(q.sent_at)} · Valid until {formatDate(q.validity_until)}
      </PageHeading>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Itemised pricing">
            <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-steel-500"><tr><th className="pb-3">Description</th><th className="pb-3 text-right">Qty</th><th className="pb-3 text-right">Unit price</th><th className="pb-3 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-steel-100">{items.map((i) => <tr key={i.id}><td className="py-3 pr-4">{i.description}</td><td className="py-3 text-right">{i.quantity}</td><td className="py-3 text-right">{m(Number(i.unit_price))}</td><td className="py-3 text-right font-semibold">{m(i.quantity * Number(i.unit_price))}</td></tr>)}</tbody>
              <tfoot className="text-sm">
                <tr className="border-t-2 border-steel-200"><td colSpan={3} className="pt-3 text-right text-steel-600">Equipment subtotal</td><td className="pt-3 text-right">{m(t.subtotal)}</td></tr>
                {t.logistics > 0 && <tr><td colSpan={3} className="pt-1.5 text-right text-steel-600">Logistics &amp; shipping</td><td className="pt-1.5 text-right">{m(t.logistics)}</td></tr>}
                {t.other > 0 && <tr><td colSpan={3} className="pt-1.5 text-right text-steel-600">{q.other_charges_label ?? "Other charges"}</td><td className="pt-1.5 text-right">{m(t.other)}</td></tr>}
                {Number(q.tax_rate) > 0 && <tr><td colSpan={3} className="pt-1.5 text-right text-steel-600">{q.tax_label ?? "Tax"} ({Number(q.tax_rate)}%)</td><td className="pt-1.5 text-right">{m(t.tax)}</td></tr>}
                <tr><td colSpan={3} className="pt-3 text-right text-base font-bold">Total ({q.currency})</td><td className="pt-3 text-right text-base font-extrabold text-[#00447B]">{m(t.total)}</td></tr>
              </tfoot></table></div>
          </Panel>
          <Panel title="Delivery, logistics & terms"><KV rows={[["Delivery estimate", q.delivery_estimate], ["Logistics estimate", q.logistics_estimate], ["Incoterm", q.incoterm], ["Payment terms", q.payment_terms], ["Commercial terms", <span key="t" className="whitespace-pre-wrap">{q.commercial_terms}</span>]]} /></Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Your response">
            {q.status === "sent" && !expired ? <QuotationResponse id={q.id} /> : (
              <div className="space-y-2 text-sm"><p>{expired && q.status === "sent" ? "This quotation has expired. Contact ProSelect to request a refreshed quotation." : <>Status: <StatusBadge s={q.status} /></>}</p>
                {q.responded_at && <p className="text-steel-600">Recorded {formatDate(q.responded_at, true)}{q.client_response_note ? ` — “${q.client_response_note}”` : ""}</p>}
                {q.status === "accepted" && <p className="rounded-md bg-steel-50 p-3 text-xs text-steel-600">Your acceptance is recorded. ProSelect will contact you to proceed; contractual workflows begin only when authorised by ProSelect.</p>}</div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

