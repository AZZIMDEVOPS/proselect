import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/dashboard/parts";
import { MarkReadButton } from "@/components/dashboard/interactive";
import { EmptyState } from "@/components/ui/card";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function PortalNotificationsPage() {
  const s = await requireClient();
  const sb = await createClient();
  const { data } = await sb
    .from("notifications")
    .select("id,title,body,link,read_at,created_at")
    .eq("user_id", s.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const unread = (data ?? []).some((n) => !n.read_at);

  return (
    <>
      <PageHeading title="Notifications" actions={unread ? <MarkReadButton /> : undefined}>
        Updates on your inquiries, quotations, shipment milestones and documents.
      </PageHeading>
      {!data?.length ? (
        <EmptyState title="You're all caught up">New procurement notifications will appear here.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-steel-200 bg-white shadow-card">
          <ul className="divide-y divide-steel-100">
            {data.map((n) => {
              const body = (
                <div className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className={`text-sm ${n.read_at ? "font-medium text-charcoal" : "font-bold text-navy-900"}`}>
                      {!n.read_at && <span className="mr-2 inline-block size-2 rounded-full bg-[#00447B] align-middle" aria-label="Unread" />}
                      {n.title}
                    </p>
                    {n.body && <p className="mt-1 text-sm text-steel-600">{n.body}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-steel-500">{formatDate(n.created_at, true)}</span>
                </div>
              );
              return <li key={n.id}>{n.link ? <Link href={n.link} className="block hover:bg-steel-50">{body}</Link> : body}</li>;
            })}
          </ul>
        </div>
      )}
    </>
  );
}

