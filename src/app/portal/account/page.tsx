import type { Metadata } from "next";
import { KV, PageHeading, Panel } from "@/components/dashboard/parts";
import { PasswordForm } from "@/components/dashboard/interactive";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account Settings" };

export default async function PortalAccountPage() {
  const s = await requireClient();
  const sb = await createClient();
  const [{ data: profile }, { data: org }] = await Promise.all([
    sb.from("profiles").select("full_name,email,phone,created_at").eq("id", s.id).maybeSingle(),
    s.organization_id
      ? sb.from("organizations").select("name,address,county,country,website").eq("id", s.organization_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <PageHeading title="Account & Organisation">
        Your ProSelect client portal profile and security settings.
      </PageHeading>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Contact & organisation details">
          <KV
            rows={[
              ["Full name", profile?.full_name],
              ["Email", profile?.email ?? s.email],
              ["Telephone", profile?.phone],
              ["Company", org?.name ?? s.company],
              ["Location", [org?.address, org?.county, org?.country].filter(Boolean).join(", ") || null],
              ["Website", org?.website],
            ]}
          />
          <p className="mt-5 text-xs text-steel-500">
            To update your registered company details or authorised contacts, message your ProSelect account manager via an active inquiry or email info@proselectimports.com.
          </p>
        </Panel>
        <Panel title="Change password">
          <PasswordForm />
        </Panel>
      </div>
    </>
  );
}

