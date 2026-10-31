import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHero } from "@/components/site/sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { getCategories } from "@/lib/data/catalogue";
import { SOLUTIONS } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Solutions — Electric Vehicles, Solar Energy Systems & Heavy Machinery Kenya",
  description: "Golf buggies and commercial electric vehicles, solar & battery storage, EV charging, and heavy machinery sourced directly from international factories for Kenya and East Africa.",
  alternates: { canonical: "/solutions" },
};

export default async function SolutionsPage() {
  const cats = await getCategories();
  return (
    <>
      <PageHero eyebrow="Solutions" title="Industrial procurement across three specialist divisions." image="/images/solution-machinery.jpg">
        Electric mobility, renewable energy and heavy machinery — each sourced directly from international manufacturers and matched to your project specification.
      </PageHero>
      {SOLUTIONS.map((s, i) => {
        const divisionBadgeTone =
          s.division === "electric-mobility" ? "fleet" : s.division === "heavy-machinery" ? "industrial" : "navy";
        const isAlternate = i % 2 === 1;

        return (
          <section key={s.slug} id={s.slug} className={`section-y scroll-mt-16 ${isAlternate ? "bg-[#E8EDF2]" : "bg-white"}`}>
            <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <Reveal className={isAlternate ? "lg:order-2" : ""}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#C4CCD4] shadow-lift">
                  <Image src={s.image} alt={`${s.title} (illustrative image)`} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="flex items-center gap-2">
                  <Badge tone={divisionBadgeTone} className="text-xs uppercase tracking-wider">
                    {s.badgeLabel}
                  </Badge>
                </div>
                <h2 className="h-section mt-3">{s.title}</h2>
                <p className="lead mt-4 text-[#2A2F36]">{s.summary}</p>
                <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-[#00447B]">Equipment categories</h3>
                <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {cats.filter((c) => c.division === s.division).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/equipment?category=${c.slug}`} className="flex items-center gap-2 text-[#2A2F36] hover:text-[#00447B] hover:underline">
                        <Check className="size-4 text-[#16794C]" aria-hidden />{c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-[#00447B]">Key applications</h3>
                <p className="mt-2 text-sm text-[#6B7682]">{s.applications.join(" · ")}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild><Link href={`/equipment?division=${s.division}`}>Browse equipment <ArrowRight /></Link></Button>
                  <Button asChild variant="outline"><Link href="/rfq">Request a Quote</Link></Button>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}
    </>
  );
}
