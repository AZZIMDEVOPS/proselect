import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, List, Search } from "lucide-react";
import { PageHero } from "@/components/site/sections";
import { CatalogueResults } from "@/components/catalogue/catalogue-results";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { filterProducts, getAllProducts, getCategories, specFacets } from "@/lib/data/catalogue";
import { DIVISION_LABEL, type Division } from "@/lib/types";
import { cn } from "@/lib/utils";

export const revalidate = 60;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.keys(sp).length > 0;
  return {
    title: "Equipment Catalogue — Golf Buggies, Solar Systems & Heavy Machinery Kenya",
    description: "Browse electric golf buggies and commercial EVs, solar & battery storage, EV charging, excavators, loaders and forklifts sourced directly from international manufacturers for Kenya.",
    alternates: { canonical: "/equipment" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [all, cats] = await Promise.all([getAllProducts(), getCategories()]);
  const division = one(sp.division), category = one(sp.category), q = one(sp.q), view = one(sp.view) === "list" ? "list" : "grid";
  const verifiedOnly = one(sp.verified) === "1";
  const facets = specFacets(all);
  const specs: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) if (k.startsWith("s_") && one(v)) specs[k.slice(2)] = one(v)!;
  const manufacturer = one(sp.manufacturer);
  const manufacturers = [...new Set(all.map((p) => p.manufacturer_name).filter(Boolean))] as string[];

  const list = filterProducts(all, { q, division, category, verifiedOnly, specs, manufacturer, sort: one(sp.sort) });
  const visibleCats = cats.filter((c) => !division || c.division === division);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, one(v)])), ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/equipment${s ? `?${s}` : ""}`;
  };
  const hasFilters = Object.keys(sp).some((k) => k !== "view");

  return (
    <>
      <PageHero eyebrow="Equipment catalogue" title="Source-to-order industrial equipment.">
        Browse electric mobility, renewable energy and heavy machinery. Pricing and availability are provided by formal quotation — there is no checkout.
      </PageHero>

      <section className="section-y !pt-10">
        <div className="container-x grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside aria-label="Filters">
            <form method="get" className="space-y-5 rounded-xl border border-steel-200 bg-white p-5 shadow-card lg:sticky lg:top-24">
              {view === "list" && <input type="hidden" name="view" value="list" />}
              <div>
                <label htmlFor="q" className="label">Search</label>
                <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel-400" aria-hidden />
                  <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, model, category…" className="field pl-9" /></div>
              </div>
              <div>
                <label htmlFor="division" className="label">Division</label>
                <select id="division" name="division" defaultValue={division ?? ""} className="field">
                  <option value="">All divisions</option>
                  {(Object.keys(DIVISION_LABEL) as Division[]).map((d) => <option key={d} value={d}>{DIVISION_LABEL[d]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="category" className="label">Category</label>
                <select id="category" name="category" defaultValue={category ?? ""} className="field">
                  <option value="">All categories</option>
                  {visibleCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              {manufacturers.length > 0 && (
                <div>
                  <label htmlFor="manufacturer" className="label">Manufacturer</label>
                  <select id="manufacturer" name="manufacturer" defaultValue={manufacturer ?? ""} className="field">
                    <option value="">All manufacturers</option>{manufacturers.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              )}
              <fieldset className="border-t border-steel-200 pt-4">
                <legend className="mb-2 text-sm font-bold text-navy-900">Specification filters</legend>
                {facets.length === 0 ? (
                  <p className="text-xs leading-relaxed text-steel-500">Specification filters appear once manufacturer-verified specifications are published. Unconfirmed data is never used for filtering.</p>
                ) : (
                  <div className="space-y-3">
                    {facets.map((f) => (
                      <div key={f.label}><label htmlFor={`s_${f.label}`} className="mb-1 block text-xs font-semibold text-steel-600">{f.label}</label>
                        <select id={`s_${f.label}`} name={`s_${f.label}`} defaultValue={specs[f.label] ?? ""} className="field !py-2 text-sm"><option value="">Any</option>{f.values.map((v) => <option key={v}>{v}</option>)}</select></div>
                    ))}
                  </div>
                )}
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="size-4 accent-[#00447B]" />Has verified specifications</label>
              </fieldset>
              <div className="flex gap-2"><Button type="submit" className="flex-1">Apply filters</Button>{hasFilters && <Button asChild variant="ghost"><Link href="/equipment">Reset</Link></Button>}</div>
            </form>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-steel-600" role="status"><strong className="text-navy-900">{list.length}</strong> {list.length === 1 ? "listing" : "listings"}{division && ` in ${DIVISION_LABEL[division as Division] ?? ""}`}</p>
              <div className="flex gap-1 rounded-md bg-steel-100 p-1" role="group" aria-label="Layout">
                {([["grid", LayoutGrid, "Grid view"], ["list", List, "List view"]] as const).map(([v, Icon, l]) => (
                  <Link key={v} href={qs({ view: v === "grid" ? undefined : v })} aria-label={l} aria-current={view === v ? "true" : undefined}
                    className={cn("rounded p-2", view === v ? "bg-white text-[#00447B] shadow-sm" : "text-steel-500 hover:text-navy-900")}><Icon className="size-4" /></Link>
                ))}
              </div>
            </div>
            {list.length ? <CatalogueResults products={list} layout={view} /> : (
              <EmptyState title="No equipment matches your filters" action={<div className="flex gap-3"><Button asChild variant="outline"><Link href="/equipment">Clear filters</Link></Button><Button asChild><Link href="/rfq">Submit a custom inquiry</Link></Button></div>}>
                We can source equipment that is not listed. Describe your requirement in a custom RFQ.
              </EmptyState>
            )}
          </div>
        </div>
      </section>
      <div className="h-16" />
    </>
  );
}

