"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, Star, Trash2, Upload } from "lucide-react";
import { AdminDataTable, type AdminColumnDef } from "./data-table";
import { Panel, StatusBadge } from "@/components/dashboard/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteProductMedia,
  saveCategory,
  saveProduct,
  setProductQuickState,
  uploadProductMedia,
  type SaveProductInput,
} from "@/lib/actions/admin";
import { DIVISION_LABEL, type Category, type ConfigOption, type Division, type Media, type Spec } from "@/lib/types";
import { slugify } from "@/lib/utils";

export interface ProductAdminRow {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  category_name: string;
  division: Division;
  manufacturer_name: string | null;
  is_featured: boolean;
  is_sample: boolean;
  status: "draft" | "published" | "archived";
  verified_specs: number;
  total_specs: number;
}

export function CatalogueAdminTable({ rows }: { rows: ProductAdminRow[] }) {
  const router = useRouter();

  const columns: AdminColumnDef<ProductAdminRow>[] = [
    {
      accessorKey: "name",
      header: "Equipment",
      cell: ({ row }) => (
        <div>
          <Link href={`/admin/catalogue/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
            {row.original.name}
          </Link>
          <p className="mt-0.5 text-xs text-steel-500">
            {row.original.model ?? "Model TBC"}
            {row.original.is_sample && <span className="ml-2 font-semibold text-amber-700">(Sample demo data)</span>}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "division",
      header: "Division",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{DIVISION_LABEL[row.original.division]}</p>
          <p className="text-xs text-steel-500">{row.original.category_name}</p>
        </div>
      ),
    },
    {
      accessorKey: "manufacturer_name",
      header: "Manufacturer",
      cell: ({ row }) => row.original.manufacturer_name ?? <span className="text-xs text-steel-400">TBC</span>,
    },
    {
      id: "specs",
      header: "Verified Specs",
      cell: ({ row }) => (
        <Badge tone={row.original.verified_specs > 0 ? "green" : "amber"}>
          {row.original.verified_specs}/{row.original.total_specs} verified
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => <StatusBadge s={row.original.status} />,
    },
    {
      id: "actions",
      header: "Quick Actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              title={p.is_featured ? "Unfeature" : "Mark featured"}
              aria-label={p.is_featured ? "Remove featured" : "Mark featured"}
              onClick={async () => {
                const r = await setProductQuickState(p.id, { is_featured: !p.is_featured });
                if (r.ok) { toast.success(p.is_featured ? "Removed from featured" : "Marked featured"); router.refresh(); } else toast.error(r.error);
              }}
              className={`rounded p-1.5 ${p.is_featured ? "text-[#00447B]" : "text-steel-400 hover:text-navy-900"}`}
            >
              <Star className="size-4" fill={p.is_featured ? "currentColor" : "none"} />
            </button>
            {p.status !== "published" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const r = await setProductQuickState(p.id, { status: "published" });
                  if (r.ok) { toast.success("Listing published"); router.refresh(); } else toast.error(r.error);
                }}
              >
                Publish
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const r = await setProductQuickState(p.id, { status: "draft" });
                  if (r.ok) { toast.success("Unpublished to draft"); router.refresh(); } else toast.error(r.error);
                }}
              >
                Unpublish
              </Button>
            )}
            {p.status !== "archived" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-steel-500"
                onClick={async () => {
                  const r = await setProductQuickState(p.id, { status: "archived" });
                  if (r.ok) { toast.success("Listing archived"); router.refresh(); } else toast.error(r.error);
                }}
              >
                Archive
              </Button>
            )}
            {p.status === "published" && (
              <Link href={`/equipment/${p.slug}`} target="_blank" className="rounded p-1.5 text-steel-500 hover:text-[#00447B]" aria-label="View public page">
                <ExternalLink className="size-4" />
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search equipment name, model, category or manufacturer…"
      emptyText="No sourcing listings yet. Click 'Add equipment' to publish a listing."
      filters={[
        {
          columnId: "division",
          label: "Division",
          options: Object.entries(DIVISION_LABEL).map(([value, label]) => ({ value, label })),
        },
        {
          columnId: "status",
          label: "Status",
          options: [
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
          ],
        },
      ]}
    />
  );
}

export function CategoryManagerPanel({ categories, canManage }: { categories: Category[]; canManage: boolean }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [division, setDivision] = React.useState<Division>("electric-mobility");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  return (
    <Panel title={`Equipment Categories (${categories.length})`}>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="max-h-56 overflow-y-auto pr-2">
          <ul className="divide-y divide-steel-100 text-sm">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="font-semibold text-navy-900">{c.name}</span>
                <span className="text-xs text-steel-500">{DIVISION_LABEL[c.division]}</span>
              </li>
            ))}
          </ul>
        </div>
        {canManage && (
          <form
            className="space-y-3 rounded-lg border border-steel-200 bg-steel-50 p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const r = await saveCategory({ name, division, description, sort_order: categories.length });
              setBusy(false);
              if (r.ok) { toast.success("Category added"); setName(""); setDescription(""); router.refresh(); } else toast.error(r.error);
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-navy-900">Add category</p>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" aria-label="Category name" className="field !py-2 text-sm" />
            <select value={division} onChange={(e) => setDivision(e.target.value as Division)} aria-label="Division" className="field !py-2 text-sm">
              {Object.entries(DIVISION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" aria-label="Category description" className="field !py-2 text-sm" />
            <Button type="submit" size="sm" variant="navy" disabled={busy || name.trim().length < 2}>
              {busy && <Loader2 className="animate-spin" />} Save category
            </Button>
          </form>
        )}
      </div>
    </Panel>
  );
}

export function ProductEditor({
  initial,
  categories,
  manufacturers,
  media = [],
}: {
  initial: SaveProductInput;
  categories: Category[];
  manufacturers: { id: string; name: string; country: string | null }[];
  media?: (Media & { id: string; publicUrl: string })[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<SaveProductInput>(initial);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const mediaFormRef = React.useRef<HTMLFormElement>(null);

  const updateSpec = (idx: number, patch: Partial<Spec>) =>
    setForm((f) => ({ ...f, specs: f.specs.map((s, n) => (n === idx ? { ...s, ...patch } : s)) }));

  const updateOpt = (field: "configurations" | "accessories", idx: number, patch: Partial<ConfigOption>) =>
    setForm((f) => ({ ...f, [field]: f[field].map((c, n) => (n === idx ? { ...c, ...patch } : c)) }));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-navy-100 bg-navy-50 px-4 py-3 text-xs text-navy-900">
        <strong>Sourcing Catalogue Integrity Policy:</strong> Never enter unverified technical claims as confirmed. Leave unknown values blank or mark them <em>Awaiting manufacturer confirmation</em>. Do not enter warehouse stock figures or retail prices.
      </div>

      <Panel title="Core Equipment Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Equipment name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) }))}
              className="field"
              placeholder="e.g. 4-Seater Lithium Golf Buggy"
            />
          </div>
          <div>
            <label className="label">URL slug</label>
            <input
              value={form.slug ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="field font-mono text-sm"
            />
          </div>
          <div>
            <label className="label">Model designation</label>
            <input
              value={form.model ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="field"
              placeholder="Leave blank or TBC until confirmed"
            />
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="field"
            >
              <option value="">Select category…</option>
              {(Object.keys(DIVISION_LABEL) as Division[]).map((d) => (
                <optgroup key={d} label={DIVISION_LABEL[d]}>
                  {categories.filter((c) => c.division === d).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Manufacturer / brand</label>
            <select
              value={form.manufacturer_id ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, manufacturer_id: e.target.value || null }))}
              className="field"
            >
              <option value="">Awaiting manufacturer assignment</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.country ? ` (${m.country})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Listing status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SaveProductInput["status"] }))}
              className="field"
            >
              <option value="draft">Draft (hidden from public)</option>
              <option value="published">Published (live in showroom)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-6 pt-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                className="size-4 accent-[#00447B]"
              />
              Featured on homepage showcase
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <input
                type="checkbox"
                checked={form.is_sample}
                onChange={(e) => setForm((f) => ({ ...f, is_sample: e.target.checked }))}
                className="size-4 accent-[#00447B]"
              />
              Label as Sample / Demonstration Listing (excluded from Google index)
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Short summary (product card)</label>
            <textarea
              rows={2}
              value={form.short_description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
              className="field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Technical overview</label>
            <textarea
              rows={4}
              value={form.overview ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
              className="field"
            />
          </div>
          <div>
            <label className="label">Performance information</label>
            <textarea
              rows={3}
              value={form.performance_info ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, performance_info: e.target.value }))}
              className="field"
            />
          </div>
          <div>
            <label className="label">Spare parts &amp; maintenance options</label>
            <textarea
              rows={3}
              value={form.spare_parts_info ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, spare_parts_info: e.target.value }))}
              className="field"
            />
          </div>
        </div>
      </Panel>

      {/* DYNAMIC SPECIFICATIONS */}
      <Panel title="Dynamic Technical Specifications & Verification Status">
        <div className="space-y-3">
          {form.specs.map((s, idx) => (
            <div key={idx} className="grid gap-2.5 rounded-lg border border-steel-200 bg-steel-50/60 p-3 sm:grid-cols-12">
              <div className="sm:col-span-2">
                <input
                  value={s.spec_group}
                  onChange={(e) => updateSpec(idx, { spec_group: e.target.value })}
                  placeholder="Group (e.g. Powertrain)"
                  aria-label="Specification group"
                  className="field !py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  value={s.label}
                  onChange={(e) => updateSpec(idx, { label: e.target.value })}
                  placeholder="Label (e.g. Battery capacity)"
                  aria-label="Specification label"
                  className="field !py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  value={s.value ?? ""}
                  onChange={(e) => updateSpec(idx, { value: e.target.value })}
                  placeholder="Value (blank if TBC)"
                  aria-label="Specification value"
                  className="field !py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-1">
                <input
                  value={s.unit ?? ""}
                  onChange={(e) => updateSpec(idx, { unit: e.target.value })}
                  placeholder="Unit"
                  aria-label="Unit"
                  className="field !py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <select
                  value={s.verification}
                  onChange={(e) => updateSpec(idx, { verification: e.target.value as Spec["verification"] })}
                  aria-label="Verification status"
                  className="field !py-1.5 text-xs"
                >
                  <option value="awaiting_confirmation">Awaiting confirmation</option>
                  <option value="verified">Manufacturer verified</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 sm:col-span-2">
                <label className="flex items-center gap-1 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={s.is_key}
                    onChange={(e) => updateSpec(idx, { is_key: e.target.checked })}
                    className="size-3.5 accent-[#00447B]"
                  />
                  Card key
                </label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, n) => n !== idx) }))}
                  className="rounded p-1 text-red-700 hover:bg-red-50"
                  aria-label="Remove specification"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                specs: [
                  ...f.specs,
                  { spec_group: "General", label: "", value: "", unit: "", verification: "awaiting_confirmation", is_key: false, sort_order: f.specs.length },
                ],
              }))
            }
          >
            <Plus /> Add specification row
          </Button>
        </div>
      </Panel>

      {/* CONFIGURATIONS & ACCESSORIES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {(
          [
            ["configurations", "Available Configurations"],
            ["accessories", "Optional Accessories"],
          ] as const
        ).map(([field, heading]) => (
          <Panel key={field} title={heading}>
            <div className="space-y-3">
              {form[field].map((c, idx) => (
                <div key={idx} className="space-y-2 rounded-lg border border-steel-200 bg-steel-50/50 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={c.name}
                      onChange={(e) => updateOpt(field, idx, { name: e.target.value })}
                      placeholder="Name"
                      className="field !py-1.5 text-sm"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={Boolean(c.verified)}
                        onChange={(e) => updateOpt(field, idx, { verified: e.target.checked })}
                        className="size-3.5 accent-[#00447B]"
                      />
                      Verified
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, [field]: f[field].filter((_, n) => n !== idx) }))}
                      className="rounded p-1 text-red-700 hover:bg-red-50"
                      aria-label="Remove option"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <input
                    value={c.description ?? ""}
                    onChange={(e) => updateOpt(field, idx, { description: e.target.value })}
                    placeholder="Description"
                    className="field !py-1.5 text-xs"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, [field]: [...f[field], { name: "", description: "", verified: false }] }))}
              >
                <Plus /> Add item
              </Button>
            </div>
          </Panel>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const r = await saveProduct(form);
            setSaving(false);
            if (r.ok) {
              toast.success(form.id ? "Equipment updated" : "Equipment created");
              if (!form.id) router.push(`/admin/catalogue/${r.data.id}`);
              else router.refresh();
            } else toast.error(r.error);
          }}
        >
          {saving && <Loader2 className="animate-spin" />} {form.id ? "Save equipment changes" : "Create equipment listing"}
        </Button>
      </div>

      {/* MEDIA GALLERY & BROCHURES */}
      <Panel title="Images, Technical Brochures & Compliance Documents">
        {!form.id ? (
          <p className="text-sm text-steel-600">Save the equipment listing above first to unlock image and brochure uploads.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              {media.length === 0 ? (
                <p className="text-sm text-steel-600">No media uploaded yet. Division illustrative photography will be displayed with an explicit label until product images are uploaded.</p>
              ) : (
                <ul className="divide-y divide-steel-100 text-sm">
                  {media.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <a href={m.publicUrl} target="_blank" rel="noopener noreferrer" className="truncate font-semibold text-navy-900 hover:text-[#00447B]">
                          {m.title || m.storage_path}
                        </a>
                        <p className="text-xs text-steel-500">
                          {m.kind.toUpperCase()} {m.is_primary ? "· Primary image" : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-700"
                        onClick={async () => {
                          const r = await deleteProductMedia(m.id);
                          if (r.ok) { toast.success("Media removed"); router.refresh(); } else toast.error(r.error);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              ref={mediaFormRef}
              className="space-y-3 rounded-lg border border-steel-200 bg-steel-50 p-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setUploading(true);
                const r = await uploadProductMedia(fd);
                setUploading(false);
                if (r.ok) { toast.success("Media uploaded"); mediaFormRef.current?.reset(); router.refresh(); } else toast.error(r.error);
              }}
            >
              <input type="hidden" name="product_id" value={form.id} />
              <div>
                <label className="label !text-xs">Media kind</label>
                <select name="kind" className="field !py-2 text-sm" defaultValue="image">
                  <option value="image">Gallery image (JPG / PNG / WebP)</option>
                  <option value="brochure">Technical brochure (PDF)</option>
                  <option value="compliance">Verified compliance certificate (PDF)</option>
                </select>
              </div>
              <div>
                <label className="label !text-xs">Title / document label</label>
                <input name="title" placeholder="e.g. Manufacturer Datasheet" className="field !py-2 text-sm" />
              </div>
              <div>
                <label className="label !text-xs">Image alt text (accessibility &amp; SEO)</label>
                <input name="alt_text" placeholder="Describe the equipment photograph" className="field !py-2 text-sm" />
              </div>
              <div>
                <label className="label !text-xs">File (max 15 MB)</label>
                <input name="file" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-xs text-steel-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" name="is_primary" value="true" className="size-4 accent-[#00447B]" />
                Set as primary gallery image
              </label>
              <Button type="submit" size="sm" disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload media
              </Button>
            </form>
          </div>
        )}
      </Panel>
    </div>
  );
}

