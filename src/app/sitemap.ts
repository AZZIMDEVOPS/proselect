import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/data/catalogue";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/about", "/solutions", "/equipment", "/manufacturer-partnerships", "/how-it-works", "/contact", "/rfq", "/privacy", "/terms"];
  const products = (await getAllProducts()).filter((p) => !p.is_sample);
  return [
    ...statics.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${SITE.url}/equipment/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}

