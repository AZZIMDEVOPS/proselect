import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { ClientsAdminTable, type ClientAdminRow } from "@/components/admin/directory-widgets";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Client Directory" };

export default async function AdminClientsPage() {
  await requireStaff();
  const db = createAdminClient();
  const [clientsRes, rfqsRes, ordersRes] = await Promise.all([
    db.from("clients").select("id,contact_name,email,phone,created_at,organizations(name,county,country)").order("created_at", { ascending: false }),
    db.from("rfqs").select("client_id"),
    db.from("orders").select("client_id"),
  ]);

  const rfqCounts = new Map<string, number>();
  for (const r of rfqsRes.data ?? []) if (r.client_id) rfqCounts.set(r.client_id, (rfqCounts.get(r.client_id) ?? 0) + 1);
  const ordCounts = new Map<string, number>();
  for (const o of ordersRes.data ?? []) if (o.client_id) ordCounts.set(o.client_id, (ordCounts.get(o.client_id) ?? 0) + 1);

  const rows: ClientAdminRow[] = (clientsRes.data ?? []).map((c) => {
    const org = c.organizations as unknown as { name: string; county: string | null; country: string | null } | null;
    return {
      id: c.id,
      company_name: org?.name ?? "Client Organisation",
      contact_name: c.contact_name,
      email: c.email,
      phone: c.phone,
      county_country: [org?.county, org?.country ?? "Kenya"].filter(Boolean).join(", "),
      rfq_count: rfqCounts.get(c.id) ?? 0,
      order_count: ordCounts.get(c.id) ?? 0,
      created_at: c.created_at,
    };
  });

  return (
    <>
      <PageHeading title="Client Management">
        Centralised B2B client directory with inquiry history, quotations, orders and restricted compliance records.
      </PageHeading>
      <ClientsAdminTable rows={rows} />
    </>
  );
}

