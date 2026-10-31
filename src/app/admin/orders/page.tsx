import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { OrdersAdminTable, type OrderAdminRow } from "@/components/admin/order-admin-widgets";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES, OPS_ROLES } from "@/lib/types";

export const metadata: Metadata = { title: "Shipment & Order Management" };

export default async function AdminOrdersPage() {
  await requireStaff([...COMMERCIAL_ROLES, ...OPS_ROLES]);
  const db = createAdminClient();
  const { data } = await db
    .from("orders")
    .select("id,reference,title,stage,delivery_site,estimated_delivery,value_amount,currency,updated_at,clients(contact_name,organizations(name))")
    .order("updated_at", { ascending: false });

  const rows: OrderAdminRow[] = (data ?? []).map((o) => {
    const cl = o.clients as unknown as { contact_name: string | null; organizations: { name: string } | null } | null;
    return {
      id: o.id,
      reference: o.reference,
      title: o.title,
      client_name: cl?.organizations?.name ?? cl?.contact_name ?? "Client",
      stage: o.stage,
      delivery_site: o.delivery_site,
      estimated_delivery: o.estimated_delivery,
      value_amount: o.value_amount != null ? Number(o.value_amount) : null,
      currency: o.currency ?? "USD",
      updated_at: o.updated_at,
    };
  });

  return (
    <>
      <PageHeading title="Shipment & Order Management">
        Track confirmed commercial orders from factory production through international transit, Mombasa port clearance and site delivery.
      </PageHeading>
      <OrdersAdminTable rows={rows} />
    </>
  );
}

