import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { ApplicationsAdminTable, type ApplicationAdminRow } from "@/components/admin/directory-widgets";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";

export const metadata: Metadata = { title: "Manufacturer Partnership Applications" };

export default async function AdminApplicationsPage() {
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();
  const { data } = await db
    .from("manufacturer_applications")
    .select("id,reference,company_name,country_of_manufacture,contact_person,representation_arrangement,status,attachments,created_at")
    .order("created_at", { ascending: false });

  const rows: ApplicationAdminRow[] = (data ?? []).map((a) => ({
    id: a.id,
    reference: a.reference,
    company_name: a.company_name,
    country_of_manufacture: a.country_of_manufacture,
    contact_person: a.contact_person,
    representation_arrangement: a.representation_arrangement,
    status: a.status,
    attachments_count: Array.isArray(a.attachments) ? a.attachments.length : 0,
    created_at: a.created_at,
  }));

  return (
    <>
      <PageHeading title="Manufacturer Partnership Applications">
        Vetting and approval workflow for international manufacturers seeking East African representation. Applications never grant automatic access to client data.
      </PageHeading>
      <ApplicationsAdminTable rows={rows} />
    </>
  );
}

