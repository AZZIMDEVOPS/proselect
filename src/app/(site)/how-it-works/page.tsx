import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHero, SectionHead } from "@/components/site/sections";
import { ProcessTimeline } from "@/components/site/process";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ORDER_STAGES } from "@/lib/types";

export const metadata: Metadata = {
  title: "How It Works — Direct Factory Equipment Sourcing East Africa",
  description: "From discovery to delivery: how Proselect coordinates RFQs, manufacturer engagement, quotations, logistics and delivery for East African businesses.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="A transparent, milestone-based procurement journey.">
        Four phases, twelve tracked milestones, one accountable team.
      </PageHero>

      {/* Phase 1-4 Timeline (White) */}
      <section className="section-y bg-white">
        <div className="container-x">
          <ProcessTimeline />
        </div>
      </section>

      {/* 12 Stages (Deep Navy: #002545) */}
      <section className="section-y bg-[#002545] text-white">
        <div className="container-x">
          <Reveal>
            <SectionHead light eyebrow="Order tracking" title="Twelve milestones, updated by our team.">
              Every stage is recorded by authorised Proselect staff — never assumed automatically — and visible in your client portal.
            </SectionHead>
          </Reveal>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER_STAGES.map(([k, l], i) => (
              <Reveal as="li" key={k} delay={(i % 4) * 0.05} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-bold text-[#C9A227]">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-1 font-semibold text-white">{l}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* RFQ Expectation (Mist Gray #E8EDF2) */}
      <section className="section-y bg-[#E8EDF2]">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="h-section">What to expect from an RFQ</h2>
            <ul className="lead mt-6 space-y-4 text-[#2A2F36]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 shrink-0 text-[#16794C] mt-0.5" />
                <span>Your request receives a unique reference and a prompt acknowledgement.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 shrink-0 text-[#16794C] mt-0.5" />
                <span>An RFQ is an enquiry only. It is not a purchase order and creates no binding commitment.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 shrink-0 text-[#16794C] mt-0.5" />
                <span>Formal quotations itemise pricing, delivery and logistics estimates, validity and commercial terms.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 shrink-0 text-[#16794C] mt-0.5" />
                <span>You can accept a quotation or request revisions from your portal. Contractual workflows begin only when authorised in writing by Proselect.</span>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="self-center rounded-xl border border-[#C4CCD4] bg-white p-10 text-center shadow-card">
            <p className="text-xl font-bold text-[#00447B]">Ready to specify your requirement?</p>
            <p className="mt-2 text-sm text-[#6B7682]">Complete our structured RFQ form for rapid technical review.</p>
            <Button asChild size="lg" className="mt-6"><Link href="/rfq">Request a Quote <ArrowRight /></Link></Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
