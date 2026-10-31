import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { KV, PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { MessageThread } from "@/components/dashboard/interactive";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPE_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiry details" };

export default async function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireClient();
  const sb = await createClient();
  const { data: r } = await sb.from("rfqs").select("*, rfq_items(*, products(name,slug))").eq("id", id).maybeSingle();
  if (!r) notFound();
  const [msgs, docs, quotes] = await Promise.all([
    sb.from("messages").select("id,body,from_staff,created_at").eq("rfq_id", id).order("created_at"),
    sb.from("documents").select("id,title,doc_type,created_at").eq("rfq_id", id).order("created_at", { ascending: false }),
    sb.from("quotations").select("id,reference,status,version").eq("rfq_id", id).order("version", { ascending: false }),
  ]);
  const items = r.rfq_items as { id: string; quantity: number; custom_description: string | null; model: string | null; specifications: string | null; power_requirements: string | null; products: { name: string; slug: string } | null }[];
  return (
    <>
      <PageHeading title={r.reference} actions={<StatusBadge s={r.status} />}>Submitted {formatDate(r.created_at, true)}</PageHeading>
      <p className="mb-6 rounded-md bg-steel-50 p-3 text-xs text-steel-600">This inquiry is an enquiry only and is not a confirmed purchase or binding order.</p>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Requested equipment">
            <ul className="space-y-4">{items.map((i) => (
              <li key={i.id} className="text-sm"><p className="font-bold">{i.quantity} × {i.products ? <Link className="hover:text-[#00447B]" href={`/equipment/${i.products.slug}`}>{i.products.name}</Link> : "Custom inquiry"}</p>
                {i.custom_description && <p className="text-steel-600">{i.custom_description}</p>}
                {i.model && <p className="text-steel-600">Model: {i.model}</p>}{i.specifications && <p className="text-steel-600">Specifications: {i.specifications}</p>}{i.power_requirements && <p className="text-steel-600">Power: {i.power_requirements}</p>}</li>))}</ul>
          </Panel>
          <Panel title="Project & delivery"><KV rows={[
            ["Company", r.company_name], ["Contact", r.contact_person], ["Location", `${r.project_location ?? ""}, ${r.county_country ?? ""}`], ["Application", r.intended_application], ["Timeline", r.procurement_timeline],
            ["Delivery destination", r.delivery_destination], ["Arrangement", r.delivery_arrangement], ["Site access", r.site_accessibility], ["Logistics support", r.logistics_support], ["Additional", r.additional_requirements],
          ]} /></Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Quotations">
            {quotes.data?.length ? <ul className="space-y-2">{quotes.data.map((q) => <li key={q.id}><Link href={`/portal/quotations/${q.id}`} className="flex items-center justify-between rounded-md border border-steel-200 p-3 text-sm hover:border-[#00447B]"><span className="font-semibold">{q.reference} · v{q.version}</span><StatusBadge s={q.status} /></Link></li>)}</ul> : <p className="text-sm text-steel-600">No quotation issued yet.</p>}
          </Panel>
          <Panel title="Documents">
            {docs.data?.length ? <ul className="space-y-2">{docs.data.map((d) => <li key={d.id}><a href={`/api/documents/${d.id}`} className="flex items-center gap-3 rounded-md border border-steel-200 p-3 text-sm hover:border-[#00447B]"><Download className="size-4 text-[#00447B]" aria-hidden /><span className="flex-1 font-semibold">{d.title}</span><span className="text-xs text-steel-500">{DOC_TYPE_LABEL[d.doc_type]}</span></a></li>)}</ul> : <p className="text-sm text-steel-600">No documents attached yet.</p>}
          </Panel>
          <Panel title="Messages with ProSelect"><MessageThread rfqId={id} viewer="client" messages={msgs.data ?? []} /></Panel>
        </div>
      </div>
    </>
  );
}

