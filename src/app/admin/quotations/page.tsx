import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { QuotationsAdminTable, type QuotationRow } from "@/components/admin/quotation-builder";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { quoteTotals } from "@/lib/quote";
import { COMMERCIAL_ROLES } from "@/lib/types";

export const metadata: Metadata = { title: "Quotation Management" };

export default async function AdminQuotationsPage() {
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();
  const { data } = await db
    .from("quotations")
    .select("id,reference,version,status,currency,validity_until,tax_rate,logistics_charge,other_charges,updated_at,rfqs(reference,company_name),quotation_items(quantity,unit_price)")
    .order("updated_at", { ascending: false });

  const rows: QuotationRow[] = (data ?? []).map((q) => {
    const rfq = q.rfqs as unknown as { reference: string; company_name: string } | null;
    const items = ((q.quotation_items ?? []) as { quantity: number; unit_price: number }[]).map((i) => ({
      description: "", quantity: i.quantity, unit_price: Number(i.unit_price),
    }));
    const t = quoteTotals(items, Number(q.logistics_charge), Number(q.other_charges), Number(q.tax_rate));
    return {
      id: q.id,
      reference: q.reference,
      version: q.version,
      company_name: rfq?.company_name ?? "Client",
      rfq_reference: rfq?.reference ?? "—",
      currency: q.currency,
      total: t.total,
      status: q.status,
      validity_until: q.validity_until,
      updated_at: q.updated_at,
    };
  });

  return (
    <>
      <PageHeading title="Quotation Management">
        Prepare commercial quotations, separate internal factory costs from client pricing, generate branded PDFs and track revisions.
      </PageHeading>
      <QuotationsAdminTable rows={rows} />
    </>
  );
}

