import type { Metadata } from "next";
import { PageHeading, Panel } from "@/components/dashboard/parts";
import { TeamRolesTable, type ProfileAdminRow } from "@/components/admin/settings-and-leads";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Team Roles & Audit Logs" };

export default async function AdminAuditPage() {
  const s = await requireStaff(["super_admin", "admin"]);
  const db = createAdminClient();
  const [profilesRes, logsRes] = await Promise.all([
    db.from("profiles").select("id,full_name,email,role,is_active,created_at").order("created_at", { ascending: false }),
    db.from("audit_logs").select("id,actor_email,action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(150),
  ]);

  return (
    <>
      <PageHeading title="Role-Based Access Control & Audit Logs">
        Assign staff roles (Super Admin, Admin, Sales Manager, Procurement Officer, Operations Officer) and inspect immutable security audit events.
      </PageHeading>

      <div className="space-y-8">
        <Panel title="Registered Accounts & Role Assignment">
          <TeamRolesTable rows={(profilesRes.data ?? []) as ProfileAdminRow[]} viewerRole={s.role} viewerId={s.id} />
        </Panel>

        <Panel title="Recent Security & Operational Audit Trail (last 150 events)">
          {!(logsRes.data ?? []).length ? (
            <p className="text-sm text-steel-600">No audit events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-steel-200 bg-steel-50 uppercase tracking-wider text-steel-500">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {logsRes.data!.map((l) => (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap p-3 text-steel-500">{formatDate(l.created_at, true)}</td>
                      <td className="p-3 font-medium">{l.actor_email ?? "Public / System"}</td>
                      <td className="p-3 font-mono font-bold text-navy-900">{l.action}</td>
                      <td className="p-3 text-steel-600">{l.entity_type ? `${l.entity_type} (${String(l.entity_id ?? "").slice(0, 8)})` : "—"}</td>
                      <td className="max-w-xs truncate p-3 font-mono text-steel-500">{l.details ? JSON.stringify(l.details) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

