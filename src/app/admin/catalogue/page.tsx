import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/dashboard/parts";
import { CatalogueAdminTable, CategoryManagerPanel, type ProductAdminRow } from "@/components/admin/catalogue-editor";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES, type Category, type Division } from "@/lib/types";

export const metadata: Metadata = { title: "Sourcing Catalogue Management" };

export default async function AdminCataloguePage() {
  const s = await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();
  const [prodsRes, catsRes] = await Promise.all([
    db
      .from("products")
      .select("id,slug,name,model,is_featured,is_sample,status,product_categories(name,division),manufacturers(name),product_specifications(verification)")
      .order("updated_at", { ascending: false }),
    db.from("product_categories").select("*").order("sort_order"),
  ]);

  const rows: ProductAdminRow[] = (prodsRes.data ?? []).map((p) => {
    const cat = p.product_categories as unknown as { name: string; division: Division } | null;
    const mfr = p.manufacturers as unknown as { name: string } | null;
    const specs = (p.product_specifications ?? []) as { verification: string }[];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      model: p.model,
      category_name: cat?.name ?? "Uncategorised",
      division: cat?.division ?? "electric-mobility",
      manufacturer_name: mfr?.name ?? null,
      is_featured: p.is_featured,
      is_sample: p.is_sample,
      status: p.status,
      verified_specs: specs.filter((x) => x.verification === "verified").length,
      total_specs: specs.length,
    };
  });

  const canManageCategories = s.role === "super_admin" || s.role === "admin";

  return (
    <>
      <PageHeading
        title="Sourcing Catalogue Management"
        actions={
          <Button asChild size="sm">
            <Link href="/admin/catalogue/new"><Plus /> Add equipment</Link>
          </Button>
        }
      >
        Manage ProSelect&apos;s B2B equipment showroom, verified technical specifications, brochures and featured listings.
      </PageHeading>

      <div className="space-y-8">
        <CatalogueAdminTable rows={rows} />
        <CategoryManagerPanel categories={(catsRes.data ?? []) as Category[]} canManage={canManageCategories} />
      </div>
    </>
  );
}

