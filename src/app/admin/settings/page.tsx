import type { Metadata } from "next";
import { PageHeading, Panel } from "@/components/dashboard/parts";
import { CmsSettingsForm } from "@/components/admin/settings-and-leads";
import { requireStaff } from "@/lib/auth";
import { getPublicSettings } from "@/lib/data/catalogue";

export const metadata: Metadata = { title: "CMS & Site Settings" };

export default async function AdminSettingsPage() {
  await requireStaff(["super_admin", "admin"]);
  const settings = await getPublicSettings();

  return (
    <>
      <PageHeading title="CMS & Public Contact Configuration">
        Manage public contact details, verified Nairobi map embed, floating WhatsApp lead channel and social links.
      </PageHeading>
      <Panel title="Website Contact & Lead Channels">
        <CmsSettingsForm initial={settings} />
      </Panel>
    </>
  );
}

