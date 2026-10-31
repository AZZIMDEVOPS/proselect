import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productImages } from "@/lib/data/catalogue";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KeySpecs({ p, max = 3 }: { p: Product; max?: number }) {
  const keys = p.specs.filter((s) => s.is_key).slice(0, max);
  if (!keys.length) return null;
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-1">
      {keys.map((s) => (
        <div key={s.label} className="flex items-baseline justify-between gap-3 border-b border-[#E8EDF2] pb-1.5 last:border-0">
          <dt className="text-[#6B7682]">{s.label}</dt>
          <dd className="flex items-center gap-1.5 text-right font-semibold text-[#00447B]">
            {s.value ? `${s.value}${s.unit ? ` ${s.unit}` : ""}` : <span className="font-medium text-[#6B7682]">To be confirmed</span>}
            {s.verification === "verified" ? (
              <BadgeCheck className="size-3.5 text-[#16794C]" aria-label="Verified" />
            ) : (
              <Clock3 className="size-3.5 text-[#B45309]" aria-label="Awaiting manufacturer confirmation" />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductCard({ p, layout = "grid", compare }: { p: Product; layout?: "grid" | "list"; compare?: React.ReactNode }) {
  const img = productImages(p)[0];
  const divisionBadgeTone =
    p.division === "electric-mobility" ? "fleet" : p.division === "heavy-machinery" ? "industrial" : "navy";

  return (
    <article className={cn("group relative overflow-hidden rounded-xl border border-[#C4CCD4] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift", layout === "list" ? "grid sm:grid-cols-[300px_1fr]" : "flex flex-col")}>
      <Link href={`/equipment/${p.slug}`} tabIndex={-1} aria-hidden className={cn("relative block overflow-hidden bg-[#E8EDF2]", layout === "list" ? "aspect-[16/10] sm:aspect-auto sm:min-h-full" : "aspect-[16/10]")}>
        <Image src={img.src} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#002545]/60 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.is_featured && <Badge tone="gold" className="bg-white">Featured</Badge>}
          {p.is_sample && <Badge tone="amber" className="bg-white">Sample listing</Badge>}
        </div>
        {img.illustrative && <span className="absolute bottom-2 left-3 text-[10px] font-semibold uppercase tracking-wider text-white/95">Illustrative image</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge tone={divisionBadgeTone} className="text-[10px] uppercase tracking-wider">
            {p.category_name}
          </Badge>
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug text-[#00447B]">
          <Link href={`/equipment/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-none hover:underline">{p.name}</Link>
        </h3>
        {p.short_description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#2A2F36]">{p.short_description}</p>}
        <div className="mt-4"><KeySpecs p={p} /></div>
        <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-5">
          <Button asChild variant="outline" size="sm"><Link href={`/equipment/${p.slug}`}>View Details <ArrowRight /></Link></Button>
          <Button asChild size="sm"><Link href={`/rfq?product=${p.slug}`}>Request a Quote</Link></Button>
          {compare && <div className="ml-auto">{compare}</div>}
        </div>
      </div>
    </article>
  );
}
