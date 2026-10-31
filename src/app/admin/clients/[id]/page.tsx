import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { ClientDetailsEditor } from "@/components/admin/directory-widgets";
import { AdminDocumentManager, InternalNotesPanel } from "@/components/admin/notes-and-docs";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Client Profile" };

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireStaff();
  const canEditSensitive = COMMERCIAL_ROLES.includes(s.role);
  const db = createAdminClient();

  const { data: client } = await db
    .from("clients")
    .select("*, organizations(*)")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const org = client.organizations as {
    id: string; name: string; registration_number: string | null; kra_pin: string | null;
    address: string | null; county: string | null; country: string | null; website: string | null;
  };

  const [rfqsRes, quotesRes, ordersRes, docsRes, notesRes] = await Promise.all([
    db.from("rfqs").select("id,reference,status,created_at,project_location").eq("client_id", id).order("created_at", { ascending: false }),
    db.from("quotations").select("id,reference,version,status,currency,sent_at").eq("client_id", id).order("created_at", { ascending: false }),
    db.from("orders").select("id,reference,title,stage,value_amount,currency,updated_at").eq("client_id", id).order("updated_at", { ascending: false }),
    db.from("documents").select("id,title,doc_type,visible_to_client,created_at").eq("client_id", id).order("created_at", { ascending: false }),
    db.from("internal_notes").select("id,body,created_at").eq("entity_type", "client").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeading title={org?.name ?? "Client"}>
        Contact: {client.contact_name ?? "—"} · {client.email ?? ""} · {client.phone ?? ""}
      </PageHeading>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <Panel title="Organisation, Contact & Restricted Compliance Details">
            <ClientDetailsEditor
              canEditSensitive={canEditSensitive}
              initial={{
                clientId: client.id,
                organizationId: org.id,
                companyName: org.name,
                contactName: client.contact_name ?? "",
                email: client.email ?? "",
                phone: client.phone ?? "",
                registration_number: canEditSensitive ? org.registration_number ?? "" : "",
                kra_pin: canEditSensitive ? org.kra_pin ?? "" : "",
                address: org.address ?? "",
                county: org.county ?? "",
                country: org.country ?? "Kenya",
                website: org.website ?? "",
              }}
            />
          </Panel>

          <Panel title={`Inquiry History (${rfqsRes.data?.length ?? 0})`}>
            {!rfqsRes.data?.length ? (
              <p className="text-sm text-steel-600">No RFQs linked yet.</p>
            ) : (
              <ul className="divide-y divide-steel-100 text-sm">
                {rfqsRes.data.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <Link href={`/admin/rfqs/${r.id}`} className="font-bold text-navy-900 hover:text-[#00447B]">
                      {r.reference} <span className="font-normal text-steel-500">· {formatDate(r.created_at)}</span>
                    </Link>
                    <StatusBadge s={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Quotations (${quotesRes.data?.length ?? 0}) & Orders (${ordersRes.data?.length ?? 0})`}>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-steel-500">Quotations</p>
                {!quotesRes.data?.length ? (
                  <p className="text-steel-600">None issued.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {quotesRes.data.map((q) => (
                      <li key={q.id} className="flex items-center justify-between">
                        <Link href={`/admin/quotations/${q.id}`} className="font-semibold text-navy-900 hover:text-[#00447B]">
                          {q.reference} v{q.version}
                        </Link>
                        <StatusBadge s={q.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-steel-100 pt-3">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-steel-500">Confirmed Orders</p>
                {!ordersRes.data?.length ? (
                  <p className="text-steel-600">No orders yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {ordersRes.data.map((o) => (
                      <li key={o.id} className="flex items-center justify-between">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-navy-900 hover:text-[#00447B]">
                          {o.reference}{o.value_amount != null ? ` (${formatMoney(o.value_amount, o.currency ?? "USD")})` : ""}
                        </Link>
                        <StatusBadge s={o.stage} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Client Document Repository">
            <AdminDocumentManager clientId={client.id} documents={docsRes.data ?? []} />
          </Panel>
          <Panel title="Internal Account & Communication Notes">
            <InternalNotesPanel entityType="client" entityId={client.id} notes={notesRes.data ?? []} />
          </Panel>
        </div>
      </div>
    </>
  );
}

