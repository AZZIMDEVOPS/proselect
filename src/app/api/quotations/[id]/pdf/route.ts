import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderQuotationPdf } from "@/lib/pdf/quotation-pdf";
import { audit } from "@/lib/audit";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Cookie-bound client enforces RLS: clients only read their own non-draft quotes; commercial staff read all.
  // Internal costs table (`quotation_internal_costs`) is NEVER queried here.
  const sb = await createClient();
  const { data: q } = await sb
    .from("quotations")
    .select("*, quotation_items(*), rfqs(reference,company_name,contact_person,email,phone,project_location,county_country)")
    .eq("id", id)
    .maybeSingle();

  if (!q) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const rfq = q.rfqs as {
    reference: string; company_name: string; contact_person: string;
    email: string; phone: string; project_location: string | null; county_country: string | null;
  } | null;

  const items = [...((q.quotation_items ?? []) as { description: string; quantity: number; unit_price: number; sort_order: number }[])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ description: i.description, quantity: i.quantity, unit_price: Number(i.unit_price) }));

  const pdf = await renderQuotationPdf({
    reference: q.reference,
    version: q.version,
    status: q.status,
    currency: q.currency,
    issuedAt: q.sent_at ?? q.created_at,
    validityUntil: q.validity_until,
    rfqReference: rfq?.reference ?? null,
    clientCompany: rfq?.company_name ?? session.company ?? "Client",
    clientContact: rfq?.contact_person ?? null,
    clientEmail: rfq?.email ?? null,
    clientPhone: rfq?.phone ?? null,
    projectLocation: [rfq?.project_location, rfq?.county_country].filter(Boolean).join(", ") || null,
    items,
    logisticsCharge: Number(q.logistics_charge ?? 0),
    otherCharges: Number(q.other_charges ?? 0),
    otherChargesLabel: q.other_charges_label,
    taxLabel: q.tax_label,
    taxRate: Number(q.tax_rate ?? 0),
    incoterm: q.incoterm,
    deliveryEstimate: q.delivery_estimate,
    logisticsEstimate: q.logistics_estimate,
    paymentTerms: q.payment_terms,
    commercialTerms: q.commercial_terms,
  });

  if (isServiceRoleConfigured()) {
    await audit({ id: session.id, email: session.email }, "quotation.pdf_downloaded", "quotation", id, { reference: q.reference });
  }

  const filename = `${q.reference}-v${q.version}.pdf`.replace(/[^\w.-]/g, "_");
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

