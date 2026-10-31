import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/site/sections";
import { getPublicSettings } from "@/lib/data/catalogue";
import { SITE } from "@/lib/site";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Contact Proselect — Nairobi, Kenya",
  description: "Contact Proselect Fleet & Industrial Solutions Limited in Nairobi for equipment sourcing, RFQs and international manufacturer partnerships.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getPublicSettings();
  const phone = String(s["contact.phone"] ?? "");
  const map = String(s["contact.map_embed_url"] ?? "");
  const mapOk = map.startsWith("https://www.google.com/maps/embed") || map.startsWith("https://www.openstreetmap.org/export/embed");
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's discuss your procurement or partnership.">
        Every message is logged as a trackable lead and routed to the right member of the Proselect team.
      </PageHero>
      <section className="section-y bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3"><h2 className="mb-8 text-2xl font-bold text-[#00447B]">Send us a message</h2><ContactForm /></div>
          <aside className="lg:col-span-2">
            <div className="rounded-xl bg-[#002545] p-8 text-white shadow-lift">
              <h2 className="text-xl font-bold !text-white">{SITE.name}</h2>
              <ul className="mt-6 space-y-5 text-sm">
                <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-[#C9A227]" aria-hidden /><span>{String(s["contact.location"] ?? SITE.location)}</span></li>
                <li className="flex gap-3"><Mail className="size-5 shrink-0 text-[#C9A227]" aria-hidden /><a className="hover:underline text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
                {phone && <li className="flex gap-3"><Phone className="size-5 shrink-0 text-[#C9A227]" aria-hidden /><a className="hover:underline text-white" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>}
              </ul>
              <p className="mt-8 border-t border-white/15 pt-6 text-xs leading-relaxed text-[#C4CCD4]">
                For equipment requests, the <a href="/rfq" className="font-semibold text-white underline">RFQ form</a> gives our procurement team everything they need to respond quickly.
              </p>
            </div>
            {mapOk && (
              <div className="mt-6 aspect-[4/3] overflow-hidden rounded-xl border border-[#C4CCD4]">
                <iframe title="Proselect office location map" src={map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="size-full border-0" />
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
