import type { Metadata } from "next";
import Image from "next/image";
import { Handshake, LineChart, MapPinned, Network, ShieldCheck, Target } from "lucide-react";
import { PageHero, SectionHead } from "@/components/site/sections";
import { ManufacturerForm } from "@/components/forms/manufacturer-form";
import { Reveal } from "@/components/ui/reveal";
import { getCategories } from "@/lib/data/catalogue";
import { DIVISION_LABEL, type Division } from "@/lib/types";
import { INDUSTRIES } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Manufacturer Partnerships — International Manufacturer Representation Kenya",
  description: "Establish your brand in East Africa. Proselect provides local representation, business development and qualified commercial leads for international manufacturers.",
  alternates: { canonical: "/manufacturer-partnerships" },
};

const BENEFITS = [
  [MapPinned, "Local presence in Nairobi", "A committed team on the ground for meetings, site visits and customer follow-up."],
  [Target, "Qualified commercial leads", "Structured RFQs with project, quantity, timeline and delivery information."],
  [LineChart, "Market intelligence", "Insight into demand, competitors, regulation and buyer expectations."],
  [Network, "Business development", "Outreach to golf & hospitality, real estate, energy, construction and industrial buyers."],
  [Handshake, "Commercial coordination", "Quotation, negotiation, documentation and logistics coordination to site."],
  [ShieldCheck, "Controlled information", "Manufacturers never receive private client or commercial data without approval."],
] as const;

export default async function PartnershipsPage() {
  const cats = await getCategories();
  const groups = (Object.keys(DIVISION_LABEL) as Division[]).map((d) => ({ division: DIVISION_LABEL[d], items: cats.filter((c) => c.division === d).map((c) => c.name) }));
  return (
    <>
      <PageHero eyebrow="Manufacturer partnerships" title="Your gateway to East African markets." image="/images/partner-manufacturer.jpg">
        Proselect provides international manufacturers with local business development, market penetration, qualified leads and professional representation in Kenya and East Africa.
      </PageHero>

      {/* Model (White) */}
      <section className="section-y bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHead eyebrow="East African opportunity" title="Growing demand for electric mobility, clean energy and infrastructure equipment." />
            <p className="lead mt-6 text-[#2A2F36]">Kenya&apos;s hospitality, real-estate, energy and construction sectors continue to invest in modern equipment. Entering the market requires local relationships, regulatory know-how and dependable after-sales coordination — the capabilities Proselect brings as your representation partner.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00447B]">Our representation model</h3>
            <ol className="mt-5 space-y-5">
              {[["Application & vetting", "We review your company, products, certifications and documents."], ["Agreement", "Representation scope, territory and terms are agreed in writing."], ["Market development", "We promote your range and qualify genuine local demand."], ["Order coordination", "RFQs become quotations and, when authorised, contracts coordinated through delivery."]].map(([t, d], i) => (
                <li key={t} className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#00447B] text-sm font-bold text-white">{i + 1}</span><div><p className="font-bold text-[#00447B]">{t}</p><p className="text-sm text-[#2A2F36]">{d}</p></div></li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Benefits (Deep Navy: #002545) */}
      <section className="section-y bg-[#002545] text-white">
        <div className="container-x">
          <Reveal><SectionHead light eyebrow="Partnership benefits" title="What Proselect brings to your brand." /></Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([Icon, t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 0.07} className="bg-[#002545] p-8 transition hover:bg-[#00335D]"><Icon className="size-8 text-[#C9A227]" strokeWidth={1.5} aria-hidden /><h3 className="mt-5 text-lg font-bold !text-white">{t}</h3><p className="mt-2 text-sm text-[#C4CCD4]">{d}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories & Industries (White) */}
      <section className="section-y bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-2xl font-bold text-[#00447B]">Product categories served</h2>
            <div className="mt-6 space-y-5">{groups.map((g) => <div key={g.division}><p className="text-sm font-bold text-[#00447B]">{g.division}</p><p className="mt-1 text-sm text-[#2A2F36]">{g.items.join(" · ")}</p></div>)}</div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-2xl font-bold text-[#00447B]">Industries served</h2>
            <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">{INDUSTRIES.map(([n]) => <li key={n} className="rounded-md border border-[#E8EDF2] bg-[#E8EDF2]/40 px-4 py-3 font-medium text-[#2A2F36]">{n}</li>)}</ul>
          </Reveal>
        </div>
      </section>

      {/* Application Form (Mist Gray #E8EDF2) */}
      <section id="apply" className="section-y scroll-mt-16 bg-[#E8EDF2]">
        <div className="container-x max-w-4xl">
          <Reveal><SectionHead eyebrow="Manufacturer onboarding" title="Submit your partnership application.">Applications enter an approval workflow. Submitting does not grant access to any client or commercial information, and does not constitute an agreement.</SectionHead></Reveal>
          <div className="mt-10 rounded-xl border border-[#C4CCD4] bg-white p-6 shadow-card sm:p-10"><ManufacturerForm categories={groups} /></div>
        </div>
      </section>
    </>
  );
}
