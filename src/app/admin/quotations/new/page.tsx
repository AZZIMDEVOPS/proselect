import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/dashboard/parts";
import { QuotationBuilder } from "@/components/admin/quotation-builder";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";

export const metadata: Metadata = { title: "New Quotation" };

export default async function AdminNewQuotationPage({ searchParams }: { searchParams: Promise<{ rfq?: string }> }) {
  await requireStaff(COMMERCIAL_ROLES);
  const { rfq: rfqId } = await searchParams;
  const db = createAdminClient();

  if (!rfqId) {
    return (
      <EmptyState
        title="Select an RFQ to generate a quotation"
        action={<Button asChild><Link href="/admin/rfqs">Open RFQ Management</Link></Button>}
      >
        Every commercial quotation is linked to a client RFQ so requirements, revisions and audit logs remain traceable.
      </EmptyState>
    );
  }

  const [{ data: rfq }, { data: products }] = await Promise.all([
    db.from("rfqs").select("*, rfq_items(*, products(id,name,model))").eq("id", rfqId).maybeSingle(),
    db.from("products").select("id,name,model").neq("status", "archived").order("name"),
  ]);
  if (!rfq) notFound();

  const rfqItems = (rfq.rfq_items ?? []) as {
    product_id: string | null; quantity: number; custom_description: string | null; model: string | null;
    products: { id: string; name: string; model: string | null } | null;
  }[];

  const defaultValidity = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

  return (
    <>
      <PageHeading title={`New Quotation for ${rfq.reference}`}>
        Client: {rfq.company_name} ({rfq.contact_person}) · Destination: {rfq.delivery_destination ?? rfq.project_location ?? "Nairobi"}
      </PageHeading>
      <QuotationBuilder
        catalogue={products ?? []}
        initial={{
          rfq_id: rfq.id,
          currency: "USD",
          validity_until: defaultValidity,
          incoterm: "CIF Mombasa",
          delivery_estimate: "8–12 weeks from contract execution",
          logistics_estimate: rfq.delivery_arrangement ?? "",
          payment_terms: "40% deposit on contract signing, 50% prior to factory dispatch, 10% upon delivery",
          commercial_terms: "Subject to manufacturer production slot confirmation and standard factory warranty.",
          tax_label: "VAT",
          tax_rate: 16,
          logistics_charge: 0,
          other_charges: 0,
          other_charges_label: "",
          items: rfqItems.length
            ? rfqItems.map((it) => ({
                product_id: it.product_id,
                description: it.products
                  ? `${it.products.name}${it.model || it.products.model ? ` — ${it.model || it.products.model}` : ""}`
                  : it.custom_description ?? "Custom sourced equipment",
                quantity: it.quantity,
                unit_price: 0,
              }))
            : [{ product_id: null, description: "", quantity: 1, unit_price: 0 }],
          internal: { manufacturer_cost_total: 0, logistics_cost_total: 0, other_internal_costs: 0, notes: "" },
        }}
      />
    </>
  );
}

