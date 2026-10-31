import type { Metadata } from "next";
import { PageHeading } from "@/components/dashboard/parts";
import { ProductEditor } from "@/components/admin/catalogue-editor";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMERCIAL_ROLES, type Category } from "@/lib/types";

export const metadata: Metadata = { title: "Add Equipment Listing" };

export default async function AdminNewProductPage() {
  await requireStaff(COMMERCIAL_ROLES);
  const db = createAdminClient();
  const [catsRes, mfrsRes] = await Promise.all([
    db.from("product_categories").select("*").order("sort_order"),
    db.from("manufacturers").select("id,name,country").order("name"),
  ]);

  return (
    <>
      <PageHeading title="Add Equipment Listing">
        Create a new source-to-order listing. Mark only manufacturer-confirmed specifications as Verified.
      </PageHeading>
      <ProductEditor
        categories={(catsRes.data ?? []) as Category[]}
        manufacturers={mfrsRes.data ?? []}
        initial={{
          name: "",
          slug: "",
          model: "",
          manufacturer_id: null,
          category_id: catsRes.data?.[0]?.id ?? "",
          short_description: "",
          overview: "",
          performance_info: "",
          spare_parts_info: "",
          is_featured: false,
          is_sample: false,
          status: "draft",
          specs: [
            { spec_group: "General", label: "", value: "", unit: "", verification: "awaiting_confirmation", is_key: true, sort_order: 0 },
          ],
          configurations: [],
          accessories: [],
        }}
      />
    </>
  );
}

