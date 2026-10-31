import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Building2, Check, ChevronDown, ClipboardCheck, Cog, Factory, Flag, Hotel, HardHat, Headset, Landmark,
  PackageX, Scale, Sun, TrendingUp, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, HeroReveal } from "@/components/ui/reveal";
import { SectionHead } from "@/components/site/sections";
import { ProcessTimeline } from "@/components/site/process";
import { ProductCard } from "@/components/catalogue/product-card";
import { EmptyState } from "@/components/ui/card";
import { getFeatured } from "@/lib/data/catalogue";
import { INDUSTRIES, SOLUTIONS } from "@/lib/site";

export const revalidate = 60;

const ADVANTAGES = [
  [Factory, "Direct Factory Access", "Engage manufacturers directly, without layers of intermediaries between your project and the production line."],
  [Scale, "Competitive Factory-Backed Procurement", "Pricing and terms built on direct manufacturer engagement, presented transparently in every quotation."],
  [PackageX, "Zero-Inventory Lean Operations", "Equipment is sourced against genuine demand — no speculative local stock and no inventory overhead passed on to you."],
  [ClipboardCheck, "Technical Specification Matching", "Your operating conditions and requirements are matched to manufacturer capabilities before any commitment."],
  [TrendingUp, "Local Market Intelligence", "On-the-ground knowledge of Kenyan and East African conditions, regulation and customer needs."],
  [Headset, "Dedicated Procurement Coordination", "A named team coordinating commercial terms, documentation and international logistics through delivery."],
] as const;

const INDUSTRY_ICONS = [Flag, Hotel, Building2, Truck, Sun, HardHat, Cog, Landmark];

export default async function HomePage() {
  const featured = await getFeatured(6);
  return (
    <>
      {/* 2. HERO */}
      <section className="relative isolate flex min-h-[calc(100svh-76px)] items-center overflow-hidden bg-[#002545] text-white">
        <Image src="/images/hero.jpg" alt="Commercial electric shuttle, excavator and solar power systems on an infrastructure project (illustrative image)" fill priority sizes="100vw" className="-z-20 animate-[kenburns_28s_ease-out_forwards] object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#002545] via-[#002545]/85 to-[#002545]/30" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#002545] to-transparent" />
        <div className="container-x py-24">
          <HeroReveal>
            <p className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#C9A227]">
              <span className="h-px w-10 bg-[#C9A227]" /> Nairobi · Global Manufacturing · East Africa
            </p>
          </HeroReveal>
          <HeroReveal delay={0.12}>
            <h1 className="h-display mt-6 max-w-4xl !text-white">DIRECT FACTORY ACCESS. SMARTER INDUSTRIAL PROCUREMENT.</h1>
          </HeroReveal>
          <HeroReveal delay={0.25}>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#C4CCD4] sm:text-lg lg:text-xl">
              Connecting East African enterprises directly with verified international manufacturers through tailored sourcing, technical procurement and dedicated local business development partnerships.
            </p>
          </HeroReveal>
          <HeroReveal delay={0.38}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent"><Link href="/solutions">Explore Our Solutions <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline-light"><Link href="/manufacturer-partnerships">Become a Manufacturer Partner</Link></Button>
            </div>
          </HeroReveal>
        </div>
        <a href="#introduction" aria-label="Scroll to introduction" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C4CCD4] sm:flex">
          Scroll <ChevronDown className="size-5 animate-scroll-cue" aria-hidden />
        </a>
      </section>

      {/* 3. INTRODUCTION (White) */}
      <section id="introduction" className="section-y scroll-mt-20 bg-white">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-lift">
              <Image src="/images/about.jpg" alt="Shipping container terminal at dawn (illustrative image)" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">About Proselect</p>
            <h2 className="h-section mt-3">Bridging Global Manufacturing with East African Opportunity.</h2>
            <p className="lead mt-6">
              Proselect Fleet &amp; Industrial Solutions Limited is an international sourcing and business development enterprise based in Nairobi. We connect genuine local demand to international factory production lines — without the cost and risk of holding local inventory.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                ["For East African enterprises", "Source specialised commercial vehicles, energy systems and machinery directly from international factories."],
                ["For international manufacturers", "Establish and expand your presence in East Africa with a committed local representation partner."],
              ].map(([t, d]) => (
                <div key={t} className="border-l-2 border-[#00447B] pl-5">
                  <h3 className="text-base font-bold text-[#00447B]">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#2A2F36]">{d}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-9"><Link href="/about">About Proselect <ArrowRight /></Link></Button>
          </Reveal>
        </div>
      </section>

      {/* 4. SOLUTIONS (Mist Gray: #E8EDF2) */}
      <section className="section-y bg-[#E8EDF2]">
        <div className="container-x">
          <Reveal><SectionHead eyebrow="Core business solutions" title="Three Divisions. One Procurement Partner.">Specialised equipment sourced to your project specification from international manufacturing partners.</SectionHead></Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.1}>
                <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#C4CCD4] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <Image src={s.image} alt={`${s.title} (illustrative image)`} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002545]/75 via-transparent" />
                    <span className="absolute left-5 top-4 text-5xl font-extrabold text-white/90">{s.no}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold leading-snug text-[#00447B]">{s.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#2A2F36]">{s.summary}</p>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#00447B]">Key applications</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[#2A2F36]">
                      {s.applications.map((a) => <li key={a} className="flex items-center gap-2"><Check className="size-4 text-[#16794C]" aria-hidden />{a}</li>)}
                    </ul>
                    <Button asChild className="mt-7 self-start"><Link href={`/solutions#${s.slug}`}>Explore Solutions <ArrowRight /></Link></Button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED EQUIPMENT (White) */}
      <section className="section-y bg-white">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal><SectionHead eyebrow="Equipment showcase" title="Featured Equipment">Source-to-order equipment, presented with manufacturer-confirmed information. Pricing and availability are provided through formal quotation.</SectionHead></Reveal>
            <Button asChild variant="outline"><Link href="/equipment">View full catalogue <ArrowRight /></Link></Button>
          </div>
          {featured.length ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 0.08}><ProductCard p={p} /></Reveal>)}
            </div>
          ) : (
            <div className="mt-12"><EmptyState title="Featured equipment will appear here" action={<Button asChild><Link href="/rfq">Submit a custom inquiry</Link></Button>}>Listings are managed from the admin dashboard.</EmptyState></div>
          )}
        </div>
      </section>

      {/* 6. WHY PROSELECT (Deep Navy: #002545) */}
      <section className="section-y bg-[#002545] text-white">
        <div className="container-x">
          <Reveal><SectionHead light eyebrow="Why Proselect?" title="A Smarter Route to Global Manufacturing." /></Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map(([Icon, t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 0.08} className="group bg-[#002545] p-8 transition hover:bg-[#00335D]">
                <Icon className="size-8 text-[#C9A227] transition group-hover:scale-110" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-5 text-lg font-bold !text-white">{t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#C4CCD4]">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS (White) */}
      <section className="section-y bg-white">
        <div className="container-x">
          <Reveal><SectionHead eyebrow="How the platform works" title="From Requirement to Delivery in Four Steps." /></Reveal>
          <div className="mt-16"><ProcessTimeline /></div>
          <div className="mt-14"><Button asChild variant="outline"><Link href="/how-it-works">See the full procurement process <ArrowRight /></Link></Button></div>
        </div>
      </section>

      {/* 8. DUAL PARTNERSHIP (Split Section) */}
      <section className="grid lg:grid-cols-2">
        {[
          { img: "/images/partner-kenya.jpg", eyebrow: "For Kenyan businesses", title: "Source Smarter. Procure Directly.", text: "Proselect helps businesses, golf clubs, resorts, property developers and industrial enterprises source specialised equipment directly from international factories — matched to specification, coordinated end to end.", cta: "Start Your Procurement Inquiry", href: "/rfq", variant: "accent" as const },
          { img: "/images/partner-manufacturer.jpg", eyebrow: "For international manufacturers", title: "Your Gateway to East African Markets.", text: "Proselect provides local business development, market penetration, qualified commercial leads and manufacturer representation — a committed partner on the ground in Nairobi.", cta: "Become a Manufacturing Partner", href: "/manufacturer-partnerships#apply", variant: "outline-light" as const },
        ].map((b) => (
          <div key={b.title} className="relative isolate flex min-h-[520px] items-end overflow-hidden text-white">
            <Image src={b.img} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#002545] via-[#002545]/75 to-[#002545]/20" />
            <Reveal className="p-8 sm:p-12 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A227]">{b.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold !text-white sm:text-4xl">{b.title}</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-[#C4CCD4]">{b.text}</p>
              <Button asChild size="lg" variant={b.variant} className="mt-8"><Link href={b.href}>{b.cta} <ArrowRight /></Link></Button>
            </Reveal>
          </div>
        ))}
      </section>

      {/* 9. INDUSTRIES (White) */}
      <section className="section-y bg-white">
        <div className="container-x">
          <Reveal><SectionHead eyebrow="Industries we serve" title="Procurement Across Eight Sectors." center /></Reveal>
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map(([name, desc], i) => {
              const Icon = INDUSTRY_ICONS[i];
              return (
                <Reveal as="li" key={name} delay={(i % 4) * 0.06} className="group rounded-xl border border-[#C4CCD4] bg-white p-6 transition hover:border-[#00447B] hover:shadow-card">
                  <Icon className="size-7 text-[#00447B]" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-base font-bold text-[#00447B]">{name}</h3>
                  <p className="mt-2 text-sm text-[#2A2F36]">{desc}</p>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 10. FINAL CONVERSION (Mist Gray #E8EDF2 — avoids consecutive dark section with Footer) */}
      <section className="section-y bg-[#E8EDF2]">
        <div className="container-x">
          <div className="rounded-2xl border border-[#C4CCD4] bg-white p-8 text-center shadow-lift sm:p-14">
            <Reveal>
              <p className="eyebrow">Next Steps</p>
              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold text-[#00447B] sm:text-4xl">Let&apos;s Build Your Next Procurement Opportunity.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#2A2F36] sm:text-lg">
                Whether you are sourcing specialized equipment or seeking a trusted East African business development partner, Proselect is ready to connect you to genuine factory-backed opportunities.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="primary"><Link href="/rfq">Request a Quote</Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="/manufacturer-partnerships#apply">Partner With Proselect</Link></Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
