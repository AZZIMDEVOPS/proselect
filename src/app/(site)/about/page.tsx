import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PageHero, SectionHead } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { TRUST_PILLARS } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Proselect — International Sourcing & Manufacturer Representation, Nairobi",
  description: "Proselect Fleet & Industrial Solutions Limited is a Nairobi-based sourcing and business development enterprise connecting East African businesses with international manufacturers.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="A lean, project-driven bridge between factories and East African demand." image="/images/about.jpg">
        Proselect Fleet &amp; Industrial Solutions Limited is headquartered in Nairobi, Kenya.
      </PageHero>

      {/* Section 1: Who we are (White) */}
      <section className="section-y bg-white">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Who we are" title="Sourcing and business development, built around real demand." />
            <div className="lead mt-6 space-y-5 text-[#2A2F36]">
              <p>Proselect connects Kenyan and East African enterprises with specialised vehicles, energy systems and machinery from international manufacturers, and helps those manufacturers establish a credible presence in the region.</p>
              <p>We operate a lean, zero-inventory model. Equipment is sourced against confirmed local demand and coordinated directly with factory production lines, so customers are not paying for speculative stock or warehousing overhead.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="grid content-start gap-5">
            {[
              ["For local enterprises", "Technical specification matching, manufacturer engagement, commercial negotiation, international logistics coordination and delivery support — managed through one accountable team."],
              ["For international manufacturers", "Local market intelligence, qualified commercial leads, business development and representation, with clear approval workflows and controlled access to information."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-[#C4CCD4] bg-white p-7 shadow-card">
                <h3 className="text-lg font-bold text-[#00447B]">{t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2A2F36]">{d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Section 2: Trust Pillars (Mist Gray #E8EDF2) */}
      <section className="section-y bg-[#E8EDF2]">
        <div className="container-x">
          <Reveal><SectionHead eyebrow="The Three Trust Pillars" title="How consistency compounds credibility." center /></Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TRUST_PILLARS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-xl border border-[#C4CCD4] bg-white p-7 shadow-card">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-6 text-[#16794C]" aria-hidden />
                    <h3 className="text-xl font-bold text-[#00447B]">{p.name}</h3>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-[#2A2F36]">{p.summary}</p>
                  <div className="mt-6 border-t border-[#E8EDF2] pt-4 text-xs text-[#6B7682]">
                    <span className="font-bold text-[#00447B]">Where it shows up: </span>{p.proof}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Call to Action (White before Footer) */}
      <section className="section-y bg-white">
        <div className="container-x">
          <div className="rounded-2xl border border-[#C4CCD4] bg-[#E8EDF2] p-8 text-center sm:p-12">
            <h2 className="text-3xl font-bold text-[#00447B]">Ready to start a conversation?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#2A2F36]">Our Nairobi-based procurement and technical desk is ready to review your specifications and supply requirements.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary"><Link href="/rfq">Request a Quote <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/contact">Contact us</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
