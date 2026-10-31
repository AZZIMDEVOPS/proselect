import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { ManufacturerEditor } from "@/components/admin/directory-widgets";
import { InternalNotesPanel } from "@/components/admin/notes-and-docs";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manufacturer Profile" };

export default async function AdminManufacturerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();

  const { data: m } = await db.from("manufacturers").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();

  const [staffRes, engRes, prodsRes, notesRes] = await Promise.all([
    db.from("profiles").select("id,full_name,email").in("role", COMMERCIAL_ROLES).eq("is_active", true),
    db.from("manufacturer_engagements").select("id,status,note,follow_up_at,created_at,rfqs(id,reference,company_name)").eq("manufacturer_id", id).order("created_at", { ascending: false }),
    db.from("products").select("id,name,slug,status").eq("manufacturer_id", id).order("name"),
    db.from("internal_notes").select("id,body,created_at").eq("entity_type", "manufacturer").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeading title={m.name} actions={<StatusBadge s={m.representation} />}>
        {m.country ? `${m.country} · ` : ""}Contact: {m.contact_person ?? "—"} ({m.email ?? "no email"})
      </PageHeading>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Manufacturer Profile & Representation Terms">
            <ManufacturerEditor
              staff={(staffRes.data ?? []).map((p) => ({ id: p.id, label: p.full_name || p.email }))}
              initial={{
                id: m.id,
                name: m.name,
                country: m.country ?? "",
                contact_person: m.contact_person ?? "",
                email: m.email ?? "",
                phone: m.phone ?? "",
                website: m.website ?? "",
                specializationsText: (m.specializations ?? []).join(", "),
                representation: m.representation,
                commercial_terms: m.commercial_terms ?? "",
                assigned_to: m.assigned_to ?? "",
                is_sample: m.is_sample,
              }}
            />
          </Panel>

          <Panel title={`Assigned Procurement Opportunities (${engRes.data?.length ?? 0})`}>
            {!engRes.data?.length ? (
              <p className="text-sm text-steel-600">No RFQs engaged with this manufacturer yet.</p>
            ) : (
              <ul className="divide-y divide-steel-100 text-sm">
                {engRes.data.map((e) => {
                  const rfq = e.rfqs as unknown as { id: string; reference: string; company_name: string } | null;
                  return (
                    <li key={e.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={rfq ? `/admin/rfqs/${rfq.id}` : "#"} className="font-bold text-navy-900 hover:text-[#00447B]">
                          {rfq ? `${rfq.reference} — ${rfq.company_name}` : "RFQ"}
                        </Link>
                        <StatusBadge s={e.status} />
                      </div>
                      {e.note && <p className="mt-1 text-steel-600">{e.note}</p>}
                      <p className="mt-0.5 text-xs text-steel-500">{formatDate(e.created_at, true)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={`Linked Catalogue Listings (${prodsRes.data?.length ?? 0})`}>
            {!prodsRes.data?.length ? (
              <p className="text-sm text-steel-600">No catalogue listings linked to this manufacturer.</p>
            ) : (
              <ul className="divide-y divide-steel-100 text-sm">
                {prodsRes.data.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/catalogue/${p.id}`} className="font-semibold text-navy-900 hover:text-[#00447B]">
                      {p.name}
                    </Link>
                    <StatusBadge s={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Internal Communication & Partnership Notes">
            <InternalNotesPanel entityType="manufacturer" entityId={id} notes={notesRes.data ?? []} />
          </Panel>
        </div>
      </div>
    </>
  );
}

