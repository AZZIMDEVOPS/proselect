import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, StatusBadge } from "@/components/dashboard/parts";
import { EmptyState } from "@/components/ui/card";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { quoteTotals } from "@/lib/quote";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "My Quotations" };

export default async function Quotations() {
  await requireClient();
  const { data } = await (await createClient()).from("quotations").select("id,reference,version,status,currency,validity_until,sent_at,tax_rate,logistics_charge,other_charges,quotation_items(quantity,unit_price)").order("created_at", { ascending: false });
  return (
    <>
      <PageHeading title="My Quotations">Formal commercial quotations issued by ProSelect.</PageHeading>
      {!data?.length ? <EmptyState title="No quotations yet">Once our team issues a quotation for your inquiry it will appear here, ready to review, download and respond to.</EmptyState> : (
        <div className="overflow-x-auto rounded-xl border border-steel-200 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-steel-50 text-xs uppercase tracking-wider text-steel-500"><tr><th className="p-4">Reference</th><th className="p-4">Issued</th><th className="p-4">Valid until</th><th className="p-4 text-right">Total</th><th className="p-4">Status</th></tr></thead>
            <tbody className="divide-y divide-steel-100">{data.map((q) => {
              const t = quoteTotals((q.quotation_items as { quantity: number; unit_price: number }[]).map((i) => ({ description: "", quantity: i.quantity, unit_price: Number(i.unit_price) })), Number(q.logistics_charge), Number(q.other_charges), Number(q.tax_rate));
              return <tr key={q.id} className="hover:bg-steel-50"><td className="p-4"><Link href={`/portal/quotations/${q.id}`} className="font-bold text-navy-900 hover:text-[#00447B]">{q.reference} <span className="font-normal text-steel-500">v{q.version}</span></Link></td>
                <td className="p-4">{formatDate(q.sent_at)}</td><td className="p-4">{formatDate(q.validity_until)}</td><td className="p-4 text-right font-semibold">{formatMoney(t.total, q.currency)}</td><td className="p-4"><StatusBadge s={q.status} /></td></tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

