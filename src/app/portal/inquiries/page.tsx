import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, StatusBadge } from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Inquiries" };

export default async function Inquiries() {
  await requireClient();
  const { data } = await (await createClient()).from("rfqs").select("id,reference,status,category,created_at,project_location,rfq_items(quantity,custom_description,products(name))").order("created_at", { ascending: false });
  return (
    <>
      <PageHeading title="My Inquiries" actions={<Button asChild><Link href="/rfq">New RFQ</Link></Button>}>Every request for quotation you have submitted.</PageHeading>
      {!data?.length ? <EmptyState title="No inquiries yet" action={<Button asChild><Link href="/rfq">Request a quote</Link></Button>}>When you submit an RFQ while signed in, it appears here with live status updates.</EmptyState> : (
        <div className="overflow-hidden rounded-xl border border-steel-200 bg-white shadow-card">
          <ul className="divide-y divide-steel-100">
            {data.map((r) => {
              const items = (r.rfq_items as unknown as { quantity: number; custom_description: string | null; products: { name: string } | null }[]) ?? [];
              return (
                <li key={r.id}><Link href={`/portal/inquiries/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-steel-50">
                  <div className="min-w-0"><p className="font-bold text-navy-900">{r.reference}</p>
                    <p className="mt-0.5 truncate text-sm text-steel-600">{items.map((i) => `${i.quantity} × ${i.products?.name ?? i.custom_description?.slice(0, 40) ?? "Custom"}`).join(", ")}</p>
                    <p className="mt-0.5 text-xs text-steel-500">{formatDate(r.created_at)} · {r.project_location}</p></div>
                  <StatusBadge s={r.status} /></Link></li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

