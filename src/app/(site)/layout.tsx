import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { WhatsAppFloat } from "@/components/site/whatsapp";
import { getPublicSettings } from "@/lib/data/catalogue";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppFloat settings={settings} />
    </>
  );
}

