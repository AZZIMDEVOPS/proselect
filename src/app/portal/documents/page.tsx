import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileLock2 } from "lucide-react";
import { PageHeading } from "@/components/dashboard/parts";
import { EmptyState } from "@/components/ui/card";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPE_LABEL } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Document Centre" };

const TYPES = [
  ["all", "All documents"],
  ["quotation", "Quotations"],
  ["commercial_invoice", "Commercial invoices"],
  ["sales_contract", "Sales contracts"],
  ["performance_guarantee", "Performance guarantees"],
  ["technical_specification", "Technical specifications"],
  ["compliance_certificate", "Compliance certificates"],
  ["shipping_document", "Shipping documents"],
] as const;

export default async function PortalDocumentsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "all" } = await searchParams;
  await requireClient();
  const sb = await createClient();

  let q = sb
    .from("documents")
    .select("id,title,doc_type,size_bytes,created_at,rfq_id,quotation_id,order_id")
    .order("created_at", { ascending: false });
  if (type !== "all") q = q.eq("doc_type", type);

  const [{ data }, quotesRes] = await Promise.all([
    q,
    type === "all" || type === "quotation"
      ? sb.from("quotations").select("id,reference,version,sent_at,status").order("sent_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const docs = data ?? [];
  const quotes = quotesRes.data ?? [];

  return (
    <>
      <PageHeading title="Document Centre">
        Encrypted, client-isolated repository for your quotations, contracts, invoices, compliance certificates and shipping documents.
      </PageHeading>

      <nav aria-label="Filter documents by type" className="mb-6 flex flex-wrap gap-2">
        {TYPES.map(([k, label]) => (
          <Link
            key={k}
            href={k === "all" ? "/portal/documents" : `/portal/documents?type=${k}`}
            aria-current={type === k ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              type === k ? "bg-navy-900 text-white" : "border border-steel-200 bg-white text-steel-600 hover:border-navy-900 hover:text-navy-900",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {docs.length === 0 && quotes.length === 0 ? (
        <EmptyState title="No documents available in this category">
          Documents uploaded for your organisation by ProSelect staff appear here automatically. Access is strictly restricted to your account.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-steel-200 bg-white shadow-card">
          <ul className="divide-y divide-steel-100">
            {quotes.map((qt) => (
              <li key={`q-${qt.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-steel-50">
                <div className="flex min-w-0 items-center gap-3">
                  <FileLock2 className="size-5 shrink-0 text-[#00447B]" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy-900">
                      Commercial Quotation {qt.reference} (v{qt.version})
                    </p>
                    <p className="text-xs text-steel-500">Quotation PDF · Issued {formatDate(qt.sent_at)}</p>
                  </div>
                </div>
                <a
                  href={`/api/quotations/${qt.id}/pdf`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-steel-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:border-[#00447B] hover:text-[#00447B]"
                >
                  <Download className="size-3.5" aria-hidden /> Download PDF
                </a>
              </li>
            ))}
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-steel-50">
                <div className="flex min-w-0 items-center gap-3">
                  <FileLock2 className="size-5 shrink-0 text-navy-700" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy-900">{d.title}</p>
                    <p className="text-xs text-steel-500">
                      {DOC_TYPE_LABEL[d.doc_type] ?? d.doc_type} · {formatDate(d.created_at)}
                      {d.size_bytes ? ` · ${Math.max(1, Math.round(Number(d.size_bytes) / 1024))} KB` : ""}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/documents/${d.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-steel-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:border-[#00447B] hover:text-[#00447B]"
                >
                  <Download className="size-3.5" aria-hidden /> Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

