import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/dashboard/parts";
import { ProductEditor } from "@/components/admin/catalogue-editor";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaUrl } from "@/lib/data/catalogue";
import { COMMERCIAL_ROLES, type Category, type ConfigOption, type Media, type Spec } from "@/lib/types";

export const metadata: Metadata = { title: "Edit Equipment Listing" };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();

  const [{ data: p }, catsRes, mfrsRes] = await Promise.all([
    db.from("products").select("*, product_specifications(*), product_media(*)").eq("id", id).maybeSingle(),
    db.from("product_categories").select("*").order("sort_order"),
    db.from("manufacturers").select("id,name,country").order("name"),
  ]);
  if (!p) notFound();

  const specs = [...((p.product_specifications ?? []) as Spec[])].sort((a, b) => a.sort_order - b.sort_order);
  const media = [...((p.product_media ?? []) as (Media & { id: string })[])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({ ...m, publicUrl: mediaUrl(m.storage_path) }));

  return (
    <>
      <PageHeading title={`Edit: ${p.name}`}>
        Slug: <code className="rounded bg-steel-100 px-1.5 py-0.5 text-xs">/equipment/{p.slug}</code>
      </PageHeading>
      <ProductEditor
        categories={(catsRes.data ?? []) as Category[]}
        manufacturers={mfrsRes.data ?? []}
        media={media}
        initial={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          model: p.model ?? "",
          manufacturer_id: p.manufacturer_id,
          category_id: p.category_id,
          short_description: p.short_description ?? "",
          overview: p.overview ?? "",
          performance_info: p.performance_info ?? "",
          spare_parts_info: p.spare_parts_info ?? "",
          is_featured: p.is_featured,
          is_sample: p.is_sample,
          status: p.status,
          specs,
          configurations: (p.configurations ?? []) as ConfigOption[],
          accessories: (p.accessories ?? []) as ConfigOption[],
        }}
      />
    </>
  );
}

