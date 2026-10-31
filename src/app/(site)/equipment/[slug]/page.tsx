import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock3, Download, FileCheck2 } from "lucide-react";
import { Gallery } from "@/components/catalogue/gallery";
import { ProductCard } from "@/components/catalogue/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllProducts, getProduct, getRelated, mediaUrl, productImages } from "@/lib/data/catalogue";
import { SITE } from "@/lib/site";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const img = productImages(p)[0];
  return {
    title: `${p.name}${p.manufacturer_name ? ` — ${p.manufacturer_name}` : ""} | ${p.category_name} Kenya`,
    description: (p.short_description ?? `${p.name} sourced directly from international manufacturers for Kenya and East Africa.`).slice(0, 158),
    alternates: { canonical: `/equipment/${p.slug}` },
    openGraph: { images: [{ url: img.src, alt: img.alt }] },
    robots: p.is_sample ? { index: false, follow: true } : undefined, // demo listings are never indexed
  };
}

function groupSpecs(p: Product) {
  const g = new Map<string, Product["specs"]>();
  p.specs.forEach((s) => g.set(s.spec_group, [...(g.get(s.spec_group) ?? []), s]));
  return [...g.entries()];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const related = await getRelated(p);
  const images = productImages(p);
  const docs = p.media.filter((m) => m.kind === "brochure" || m.kind === "compliance");
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.short_description ?? undefined,
    category: p.category_name, image: images.map((i) => (i.src.startsWith("/") ? SITE.url + i.src : i.src)),
    ...(p.model && !p.model.includes("confirmed") ? { model: p.model } : {}),
    ...(p.manufacturer_name && !p.is_sample ? { brand: { "@type": "Brand", name: p.manufacturer_name } } : {}),
  };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Equipment", item: `${SITE.url}/equipment` },
    { "@type": "ListItem", position: 2, name: p.name, item: `${SITE.url}/equipment/${p.slug}` },
  ] };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, crumbs]) }} />
      <div className="border-b border-steel-200 bg-steel-50">
        <nav aria-label="Breadcrumb" className="container-x py-4 text-sm text-steel-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link className="hover:text-[#00447B]" href="/equipment">Equipment</Link></li><li aria-hidden>/</li>
            <li><Link className="hover:text-[#00447B]" href={`/equipment?category=${p.category_slug}`}>{p.category_name}</Link></li><li aria-hidden>/</li>
            <li aria-current="page" className="font-semibold text-navy-900">{p.name}</li>
          </ol>
        </nav>
      </div>

      <section className="section-y !pt-10">
        <div className="container-x grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Gallery images={images} />
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="crimson">{p.category_name}</Badge>
              {p.is_featured && <Badge tone="navy">Featured</Badge>}
              {p.is_sample && <Badge tone="amber">Sample listing — demo data</Badge>}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{p.name}</h1>
            <dl className="mt-5 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
              <dt className="text-steel-500">Model</dt><dd className="font-semibold">{p.model ?? "To be confirmed"}</dd>
              <dt className="text-steel-500">Manufacturer</dt><dd className="font-semibold">{p.manufacturer_name ?? "To be confirmed"}{p.manufacturer_country ? `, ${p.manufacturer_country}` : ""}</dd>
              <dt className="text-steel-500">Category</dt><dd className="font-semibold">{p.category_name}</dd>
            </dl>
            {p.short_description && <p className="lead mt-6">{p.short_description}</p>}
            <div className="mt-6 rounded-lg border border-steel-200 bg-steel-50 p-4 text-sm text-steel-600">
              <p className="flex items-center gap-2 font-semibold text-navy-900"><Clock3 className="size-4 text-amber-600" aria-hidden />Pricing &amp; availability</p>
              <p className="mt-1">Provided by formal quotation, based on your specification, quantity and delivery location.</p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href={`/rfq?product=${p.slug}`}>Request Custom Quote</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/contact">Ask a technical question</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-steel-50 py-16">
        <div className="container-x grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold">Technical overview</h2>
              <p className="mt-4 leading-relaxed text-steel-600">{p.overview ?? "Technical overview awaiting manufacturer confirmation."}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">Detailed specifications</h2>
              <p className="mt-2 flex flex-wrap items-center gap-4 text-xs text-steel-600">
                <span className="inline-flex items-center gap-1"><BadgeCheck className="size-4 text-emerald-600" aria-hidden /> Verified by manufacturer</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="size-4 text-amber-600" aria-hidden /> Awaiting manufacturer confirmation</span>
              </p>
              {p.specs.length ? (
                <div className="mt-5 space-y-6">
                  {groupSpecs(p).map(([group, rows]) => (
                    <div key={group} className="overflow-hidden rounded-xl border border-steel-200 bg-white">
                      <h3 className="bg-navy-900 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white">{group}</h3>
                      <table className="w-full text-sm"><tbody>
                        {rows.map((s) => (
                          <tr key={s.label} className="border-t border-steel-100 first:border-0">
                            <th scope="row" className="w-1/2 px-5 py-3 text-left font-medium text-steel-600">{s.label}</th>
                            <td className="px-5 py-3">
                              <span className="font-semibold">{s.value ? `${s.value}${s.unit ? ` ${s.unit}` : ""}` : "To be confirmed"}</span>
                              {s.verification === "verified"
                                ? <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="size-3.5" aria-hidden />Verified</span>
                                : <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><Clock3 className="size-3.5" aria-hidden />Awaiting confirmation</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-4 text-sm text-steel-600">Specifications awaiting manufacturer confirmation.</p>}
            </div>

            <div>
              <h2 className="text-2xl font-bold">Performance information</h2>
              <p className="mt-4 leading-relaxed text-steel-600">{p.performance_info ?? "Awaiting manufacturer confirmation."}</p>
            </div>

            {([["Available configurations", p.configurations], ["Optional accessories", p.accessories]] as const).map(([t, list]) => (
              <div key={t}>
                <h2 className="text-2xl font-bold">{t}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {list.length ? list.map((c) => (
                    <li key={c.name} className="rounded-lg border border-steel-200 bg-white p-4"><p className="font-semibold">{c.name}</p>{c.description && <p className="mt-1 text-sm text-steel-600">{c.description}</p>}
                      <p className={`mt-2 text-xs font-semibold ${c.verified ? "text-emerald-700" : "text-amber-700"}`}>{c.verified ? "Verified" : "Awaiting confirmation"}</p></li>
                  )) : <li className="text-sm text-steel-600">Awaiting manufacturer confirmation.</li>}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="text-2xl font-bold">Spare parts &amp; maintenance</h2>
              <p className="mt-4 leading-relaxed text-steel-600">{p.spare_parts_info ?? "Confirmed per project during quotation."}</p>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-steel-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold">Documents</h2>
              {docs.length ? (
                <ul className="mt-4 space-y-3">
                  {docs.map((d) => (
                    <li key={d.storage_path}><a href={mediaUrl(d.storage_path)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md border border-steel-200 p-3 text-sm font-semibold hover:border-[#00447B]">
                      {d.kind === "brochure" ? <Download className="size-4 text-[#00447B]" aria-hidden /> : <FileCheck2 className="size-4 text-[#00447B]" aria-hidden />}
                      <span>{d.title ?? (d.kind === "brochure" ? "Technical brochure" : "Compliance document")}</span></a></li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-steel-600">Technical brochures and compliance documents are published here when supplied and verified. Request them with your quote.</p>}
            </div>
            <div className="rounded-xl bg-navy-900 p-6 text-white">
              <p className="text-lg font-bold">Need a configuration or quantity discussion?</p>
              <Button asChild className="mt-4 w-full"><Link href={`/rfq?product=${p.slug}`}>Request Custom Quote</Link></Button>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-y">
          <div className="container-x">
            <h2 className="h-section">Related equipment</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}

