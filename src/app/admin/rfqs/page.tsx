import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { RfqAdminTable, type RfqTableRow } from "@/components/admin/rfq-admin-widgets";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Division } from "@/lib/types";

export const metadata: Metadata = { title: "RFQ Management" };

export default async function AdminRfqsPage() {
  await requireStaff();
  const db = createAdminClient();
  const [rfqsRes, staffRes] = await Promise.all([
    db.from("rfqs").select("id,reference,company_name,contact_person,category,status,assigned_to,follow_up_at,created_at").order("created_at", { ascending: false }),
    db.from("profiles").select("id,full_name,email").neq("role", "client"),
  ]);

  const staffMap = new Map((staffRes.data ?? []).map((p) => [p.id, p.full_name || p.email]));
  const rows: RfqTableRow[] = (rfqsRes.data ?? []).map((r) => ({
    id: r.id,
    reference: r.reference,
    company_name: r.company_name,
    contact_person: r.contact_person,
    category: (r.category as Division | null) ?? null,
    status: r.status,
    assignee_name: r.assigned_to ? staffMap.get(r.assigned_to) ?? null : null,
    follow_up_at: r.follow_up_at,
    created_at: r.created_at,
  }));

  return (
    <>
      <PageHeading title="RFQ Management">
        Review incoming requests for quotation, assign procurement officers, coordinate manufacturers and generate formal quotations.
      </PageHeading>
      <RfqAdminTable rows={rows} />
    </>
  );
}

