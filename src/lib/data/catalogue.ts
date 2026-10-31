import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_SETTINGS } from "@/data/seed";
import type { Category, Division, Product } from "@/lib/types";

export const DIVISION_FALLBACK_IMAGE: Record<Division, string> = {
  "electric-mobility": "/images/solution-mobility.jpg",
  "renewable-energy": "/images/solution-energy.jpg",
  "heavy-machinery": "/images/solution-machinery.jpg",
};

export const mediaUrl = (path: string) =>
  path.startsWith("/") || path.startsWith("http")
    ? path
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/${path}`;

export function productImages(p: Product) {
  const imgs = p.media.filter((m) => m.kind === "image").sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  if (imgs.length) return imgs.map((m) => ({ src: mediaUrl(m.storage_path), alt: m.alt_text || `${p.name} — ${p.category_name}`, illustrative: false }));
  return [{ src: DIVISION_FALLBACK_IMAGE[p.division], alt: `Illustrative image — ${p.category_name} (product photography pending)`, illustrative: true }];
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return SEED_CATEGORIES;
  try {
    const { data, error } = await createPublicClient().from("product_categories").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch (e) {
    console.error("getCategories", e);
    return SEED_CATEGORIES;
  }
}

/** All published products with specs/media. Cached at the page level via `revalidate`. */
export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return SEED_PRODUCTS;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("products")
      .select("*, product_categories(slug,name,division), product_specifications(*), product_media(*)")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const mfrIds = [...new Set((data ?? []).map((p) => p.manufacturer_id).filter(Boolean))];
    const mfrs = new Map<string, { name: string; country: string | null }>();
    if (mfrIds.length) {
      const { data: m } = await sb.from("manufacturer_public").select("id,name,country").in("id", mfrIds);
      m?.forEach((x) => mfrs.set(x.id, x));
    }
    return (data ?? []).map((p): Product => ({
      id: p.id, slug: p.slug, name: p.name, model: p.model,
      manufacturer_name: mfrs.get(p.manufacturer_id)?.name ?? null,
      manufacturer_country: mfrs.get(p.manufacturer_id)?.country ?? null,
      category_slug: p.product_categories.slug, category_name: p.product_categories.name, division: p.product_categories.division,
      short_description: p.short_description, overview: p.overview, performance_info: p.performance_info,
      configurations: p.configurations ?? [], accessories: p.accessories ?? [], spare_parts_info: p.spare_parts_info,
      is_featured: p.is_featured, is_sample: p.is_sample, status: p.status,
      specs: (p.product_specifications ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
      media: (p.product_media ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
    }));
  } catch (e) {
    console.error("getAllProducts", e);
    return [];
  }
}

export async function getProduct(slug: string) {
  return (await getAllProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getFeatured(n = 6) {
  const all = await getAllProducts();
  const f = all.filter((p) => p.is_featured);
  return (f.length ? f : all).slice(0, n);
}

export async function getRelated(p: Product, n = 3) {
  const all = (await getAllProducts()).filter((x) => x.id !== p.id);
  const same = all.filter((x) => x.category_slug === p.category_slug);
  const div = all.filter((x) => x.division === p.division && x.category_slug !== p.category_slug);
  return [...same, ...div].slice(0, n);
}

export interface CatalogueQuery {
  q?: string; division?: string; category?: string; manufacturer?: string;
  featured?: boolean; verifiedOnly?: boolean; specs?: Record<string, string>; sort?: string;
}

export function filterProducts(all: Product[], f: CatalogueQuery) {
  const q = f.q?.trim().toLowerCase();
  let list = all.filter((p) => {
    if (f.division && p.division !== f.division) return false;
    if (f.category && p.category_slug !== f.category) return false;
    if (f.manufacturer && p.manufacturer_name !== f.manufacturer) return false;
    if (f.featured && !p.is_featured) return false;
    if (q) {
      const hay = [p.name, p.model, p.short_description, p.category_name, p.manufacturer_name, ...p.specs.map((s) => `${s.label} ${s.value ?? ""}`)].join(" ").toLowerCase();
      if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    if (f.verifiedOnly && !p.specs.some((s) => s.verification === "verified")) return false;
    for (const [label, value] of Object.entries(f.specs ?? {})) {
      if (!p.specs.some((s) => s.label === label && s.value === value && s.verification === "verified")) return false;
    }
    return true;
  });
  if (f.sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/** Spec facets built only from VERIFIED values so filters never advertise unconfirmed data. */
export function specFacets(all: Product[]) {
  const map = new Map<string, Set<string>>();
  for (const p of all) for (const s of p.specs) {
    if (s.verification !== "verified" || !s.value) continue;
    if (!map.has(s.label)) map.set(s.label, new Set());
    map.get(s.label)!.add(s.value);
  }
  return [...map.entries()].filter(([, v]) => v.size > 0 && v.size <= 12).map(([label, v]) => ({ label, values: [...v].sort() }));
}

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const defaults = Object.fromEntries(SEED_SETTINGS.map((s) => [s.key, s.value]));
  if (!isSupabaseConfigured()) return defaults;
  try {
    const { data } = await createPublicClient().from("site_settings").select("key,value").eq("is_public", true);
    return { ...defaults, ...Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) };
  } catch {
    return defaults;
  }
}

