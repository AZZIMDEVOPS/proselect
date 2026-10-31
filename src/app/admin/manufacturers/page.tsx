import type { Metadata } from "next";
import { PageHeading, Panel, StatCard } from "@/components/dashboard/parts";
import {
  ManufacturerEditor,
  ManufacturersAdminTable,
  REP_STATUS_OPTIONS,
  type ManufacturerAdminRow,
} from "@/components/admin/directory-widgets";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";

export const metadata: Metadata = { title: "Manufacturer Directory & Lead Pipeline" };

export default async function AdminManufacturersPage() {
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();
  const [mfrsRes, engRes, staffRes] = await Promise.all([
    db.from("manufacturers").select("*").order("created_at", { ascending: false }),
    db.from("manufacturer_engagements").select("manufacturer_id"),
    db.from("profiles").select("id,full_name,email").in("role", COMMERCIAL_ROLES).eq("is_active", true),
  ]);

  const engCounts = new Map<string, number>();
  for (const e of engRes.data ?? []) engCounts.set(e.manufacturer_id, (engCounts.get(e.manufacturer_id) ?? 0) + 1);

  const mfrs = mfrsRes.data ?? [];
  const rows: ManufacturerAdminRow[] = mfrs.map((m) => ({
    id: m.id,
    name: m.name,
    country: m.country,
    contact_person: m.contact_person,
    specializations: m.specializations ?? [],
    representation: m.representation,
    engagements_count: engCounts.get(m.id) ?? 0,
    is_sample: m.is_sample,
  }));

  const staff = (staffRes.data ?? []).map((p) => ({ id: p.id, label: p.full_name || p.email }));

  return (
    <>
      <PageHeading title="Manufacturer Directory & Representation Pipeline">
        Manage international factory relationships, representation agreements, commercial terms and assigned East African opportunities.
      </PageHeading>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {REP_STATUS_OPTIONS.map(([key, label]) => (
          <StatCard
            key={key}
            title={label}
            value={mfrs.filter((m) => m.representation === key).length}
            accent={key === "authorised_representative"}
          />
        ))}
      </div>

      <div className="space-y-8">
        <ManufacturersAdminTable rows={rows} />
        <Panel title="Add Manufacturer to Directory / Lead Pipeline">
          <ManufacturerEditor
            staff={staff}
            initial={{
              name: "",
              country: "",
              contact_person: "",
              email: "",
              phone: "",
              website: "",
              specializationsText: "",
              representation: "prospect",
              commercial_terms: "",
              assigned_to: "",
              is_sample: false,
            }}
          />
        </Panel>
      </div>
    </>
  );
}

