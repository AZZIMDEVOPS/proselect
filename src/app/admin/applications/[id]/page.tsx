import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { KV, PageHeading, Panel, StatusBadge } from "@/components/dashboard/parts";
import { ApplicationReviewForm } from "@/components/admin/directory-widgets";
import { InternalNotesPanel } from "@/components/admin/notes-and-docs";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Review Partnership Application" };

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();

  const [{ data: app }, { data: notes }] = await Promise.all([
    db.from("manufacturer_applications").select("*").eq("id", id).maybeSingle(),
    db.from("internal_notes").select("id,body,created_at").eq("entity_type", "application").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);
  if (!app) notFound();

  const attachments = (app.attachments ?? []) as { path: string; name: string; kind: string }[];

  return (
    <>
      <PageHeading title={`${app.reference} — ${app.company_name}`} actions={<StatusBadge s={app.status} />}>
        Submitted {formatDate(app.created_at, true)} · {app.country_of_manufacture}
      </PageHeading>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Panel title="Applicant & Product Capabilities">
            <KV
              rows={[
                ["Manufacturer", app.company_name],
                ["Country of manufacture", app.country_of_manufacture],
                ["Website", app.website ? <a key="w" href={app.website} target="_blank" rel="noopener noreferrer" className="text-[#00447B] underline">{app.website}</a> : null],
                ["Contact person", app.contact_person],
                ["Email", <a key="e" href={`mailto:${app.email}`} className="text-[#00447B] underline">{app.email}</a>],
                ["Telephone", app.phone],
                ["Product categories", (app.product_categories ?? []).join(" · ")],
                ["Desired arrangement", app.representation_arrangement],
                ["Products & capabilities", <span key="p" className="whitespace-pre-wrap">{app.products_summary}</span>],
                ["Stated certifications", <span key="c" className="whitespace-pre-wrap">{app.certifications}</span>],
                ["Additional message", <span key="m" className="whitespace-pre-wrap">{app.message}</span>],
                [
                  "Linked directory record",
                  app.manufacturer_id ? (
                    <Link key="mfr" href={`/admin/manufacturers/${app.manufacturer_id}`} className="font-bold text-[#00447B] hover:underline">
                      Open Manufacturer Directory Profile →
                    </Link>
                  ) : null,
                ],
              ]}
            />
          </Panel>

          <Panel title={`Submitted Catalogues, Brochures & Certificates (${attachments.length})`}>
            {attachments.length === 0 ? (
              <p className="text-sm text-steel-600">No files were attached to this application.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li key={a.path}>
                    <a
                      href={`/api/manufacturer-submissions?applicationId=${encodeURIComponent(app.id)}&path=${encodeURIComponent(a.path)}`}
                      className="flex items-center gap-3 rounded-md border border-steel-200 p-3 text-sm font-semibold text-navy-900 hover:border-[#00447B]"
                    >
                      <Download className="size-4 text-[#00447B]" aria-hidden />
                      <span className="truncate">{a.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Approval Workflow">
            <ApplicationReviewForm
              applicationId={app.id}
              initialStatus={app.status}
              hasLinkedManufacturer={Boolean(app.manufacturer_id)}
            />
          </Panel>

          <Panel title="Internal Vetting Notes">
            <InternalNotesPanel entityType="application" entityId={app.id} notes={notes ?? []} />
          </Panel>
        </div>
      </div>
    </>
  );
}

