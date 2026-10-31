import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { LeadsAdminTable, type LeadAdminRow } from "@/components/admin/settings-and-leads";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Contact Leads" };

export default async function AdminLeadsPage() {
  await requireStaff();
  const db = createAdminClient();
  const { data } = await db.from("leads").select("*").order("created_at", { ascending: false });

  return (
    <>
      <PageHeading title="Contact & Lead Generation">
        Trackable inquiries submitted through the public Contact page. Qualify and convert equipment requests into structured RFQs.
      </PageHeading>
      <LeadsAdminTable rows={(data ?? []) as LeadAdminRow[]} />
    </>
  );
}

