"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { AdminDataTable, type AdminColumnDef } from "./data-table";
import { StatusBadge } from "@/components/dashboard/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reviewManufacturerApplication, saveManufacturer, updateClientDetails } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";

// ================================================================ CLIENTS
export interface ClientAdminRow {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  county_country: string;
  rfq_count: number;
  order_count: number;
  created_at: string;
}

const clientCols: AdminColumnDef<ClientAdminRow>[] = [
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => (
      <Link href={`/admin/clients/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
        {row.original.company_name}
      </Link>
    ),
  },
  {
    accessorKey: "contact_name",
    header: "Primary Contact",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold">{row.original.contact_name ?? "—"}</p>
        <p className="text-xs text-steel-500">{row.original.email ?? ""}</p>
      </div>
    ),
  },
  { accessorKey: "phone", header: "Telephone", cell: ({ row }) => row.original.phone ?? "—" },
  { accessorKey: "county_country", header: "Location" },
  { accessorKey: "rfq_count", header: "RFQs" },
  { accessorKey: "order_count", header: "Orders" },
  { accessorKey: "created_at", header: "Since", cell: ({ row }) => formatDate(row.original.created_at) },
];

export function ClientsAdminTable({ rows }: { rows: ClientAdminRow[] }) {
  return (
    <AdminDataTable
      data={rows}
      columns={clientCols}
      searchPlaceholder="Search company, contact, email or phone…"
      emptyText="No client accounts or RFQ contacts recorded yet."
    />
  );
}

export function ClientDetailsEditor({
  initial,
  canEditSensitive,
}: {
  initial: {
    clientId: string;
    organizationId: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    registration_number: string;
    kra_pin: string;
    address: string;
    county: string;
    country: string;
    website: string;
  };
  canEditSensitive: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await updateClientDetails(form);
        setBusy(false);
        if (r.ok) { toast.success("Client record updated"); router.refresh(); } else toast.error(r.error);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label !text-xs">Company name</label>
          <input required disabled={!canEditSensitive} value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Primary contact</label>
          <input disabled={!canEditSensitive} value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Business email</label>
          <input type="email" disabled={!canEditSensitive} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Telephone</label>
          <input disabled={!canEditSensitive} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Address</label>
          <input disabled={!canEditSensitive} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">County / Country</label>
          <div className="grid grid-cols-2 gap-2">
            <input disabled={!canEditSensitive} value={form.county} onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))} placeholder="County" className="field !py-2 text-sm" />
            <input disabled={!canEditSensitive} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Country" className="field !py-2 text-sm" />
          </div>
        </div>
      </div>

      {canEditSensitive && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Lock className="size-3.5" aria-hidden /> Restricted Compliance Fields (Authorised Commercial Staff Only)
          </p>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Collect only when legitimately required for formal contracting, port clearance or tax invoicing. Column-revoked from browser roles.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label !text-xs">Business Registration No.</label>
              <input value={form.registration_number} onChange={(e) => setForm((f) => ({ ...f, registration_number: e.target.value }))} className="field bg-white !py-2 text-sm" />
            </div>
            <div>
              <label className="label !text-xs">KRA PIN</label>
              <input value={form.kra_pin} onChange={(e) => setForm((f) => ({ ...f, kra_pin: e.target.value }))} className="field bg-white !py-2 font-mono text-sm uppercase" />
            </div>
          </div>
        </div>
      )}

      {canEditSensitive && (
        <Button type="submit" size="sm" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Save client details
        </Button>
      )}
    </form>
  );
}

// ================================================================ MANUFACTURERS
export const REP_STATUS_OPTIONS = [
  ["prospect", "Prospect"],
  ["in_discussion", "In discussion"],
  ["agreement_pending", "Agreement pending"],
  ["authorised_representative", "Authorised representative"],
  ["paused", "Paused"],
  ["declined", "Declined"],
] as const;

export interface ManufacturerAdminRow {
  id: string;
  name: string;
  country: string | null;
  contact_person: string | null;
  specializations: string[];
  representation: string;
  engagements_count: number;
  is_sample: boolean;
}

const mfrCols: AdminColumnDef<ManufacturerAdminRow>[] = [
  {
    accessorKey: "name",
    header: "Manufacturer",
    cell: ({ row }) => (
      <div>
        <Link href={`/admin/manufacturers/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
          {row.original.name}
        </Link>
        {row.original.is_sample && <span className="ml-2 text-xs font-semibold text-amber-700">(Sample)</span>}
      </div>
    ),
  },
  { accessorKey: "country", header: "Country", cell: ({ row }) => row.original.country ?? "—" },
  { accessorKey: "contact_person", header: "Contact", cell: ({ row }) => row.original.contact_person ?? "—" },
  {
    id: "specs",
    header: "Specializations",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.specializations.slice(0, 3).map((s) => (
          <Badge key={s} tone="neutral">{s}</Badge>
        ))}
        {row.original.specializations.length > 3 && <Badge tone="neutral">+{row.original.specializations.length - 3}</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "representation",
    header: "Representation Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge s={row.original.representation} />,
  },
  { accessorKey: "engagements_count", header: "Assigned RFQs" },
];

export function ManufacturersAdminTable({ rows }: { rows: ManufacturerAdminRow[] }) {
  return (
    <AdminDataTable
      data={rows}
      columns={mfrCols}
      searchPlaceholder="Search manufacturer, country or contact…"
      emptyText="No manufacturers in directory yet."
      filters={[
        {
          columnId: "representation",
          label: "Representation",
          options: REP_STATUS_OPTIONS.map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}

export function ManufacturerEditor({
  initial,
  staff,
}: {
  initial: {
    id?: string;
    name: string;
    country: string;
    contact_person: string;
    email: string;
    phone: string;
    website: string;
    specializationsText: string;
    representation: "prospect" | "in_discussion" | "agreement_pending" | "authorised_representative" | "paused" | "declined";
    commercial_terms: string;
    assigned_to: string;
    is_sample: boolean;
  };
  staff: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await saveManufacturer({
          id: form.id,
          name: form.name,
          country: form.country,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          website: form.website,
          specializations: form.specializationsText.split(",").map((s) => s.trim()).filter(Boolean),
          representation: form.representation,
          commercial_terms: form.commercial_terms,
          assigned_to: form.assigned_to || null,
          is_sample: form.is_sample,
        });
        setBusy(false);
        if (r.ok) {
          toast.success(form.id ? "Manufacturer updated" : "Manufacturer added to directory");
          if (!form.id) router.push(`/admin/manufacturers/${r.data.id}`);
          else router.refresh();
        } else toast.error(r.error);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label !text-xs">Manufacturer name *</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Country</label>
          <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Contact person</label>
          <input value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Phone / WhatsApp</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Website</label>
          <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://" className="field !py-2 text-sm" />
        </div>
        <div>
          <label className="label !text-xs">Representation pipeline stage</label>
          <select value={form.representation} onChange={(e) => setForm((f) => ({ ...f, representation: e.target.value as typeof form.representation }))} className="field !py-2 text-sm">
            {REP_STATUS_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label !text-xs">Business development owner</label>
          <select value={form.assigned_to} onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))} className="field !py-2 text-sm">
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-xs">Product specializations (comma-separated)</label>
          <input value={form.specializationsText} onChange={(e) => setForm((f) => ({ ...f, specializationsText: e.target.value }))} placeholder="e.g. Electric Golf Buggies, Hybrid Inverters, Forklifts" className="field !py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-xs">Commercial terms &amp; representation agreement summary (INTERNAL ONLY)</label>
          <textarea rows={3} value={form.commercial_terms} onChange={(e) => setForm((f) => ({ ...f, commercial_terms: e.target.value }))} className="field text-sm" placeholder="Territory scope, dealer discount tier, warranty support obligations, MOQ…" />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} {form.id ? "Save manufacturer" : "Add manufacturer"}
      </Button>
    </form>
  );
}

// ================================================================ APPLICATIONS
export interface ApplicationAdminRow {
  id: string;
  reference: string;
  company_name: string;
  country_of_manufacture: string;
  contact_person: string;
  representation_arrangement: string | null;
  status: string;
  attachments_count: number;
  created_at: string;
}

const appCols: AdminColumnDef<ApplicationAdminRow>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <Link href={`/admin/applications/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
        {row.original.reference}
      </Link>
    ),
  },
  { accessorKey: "company_name", header: "Manufacturer" },
  { accessorKey: "country_of_manufacture", header: "Country" },
  { accessorKey: "representation_arrangement", header: "Desired Arrangement", cell: ({ row }) => row.original.representation_arrangement ?? "—" },
  { accessorKey: "attachments_count", header: "Files" },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge s={row.original.status} />,
  },
  { accessorKey: "created_at", header: "Submitted", cell: ({ row }) => formatDate(row.original.created_at) },
];

export function ApplicationsAdminTable({ rows }: { rows: ApplicationAdminRow[] }) {
  return (
    <AdminDataTable
      data={rows}
      columns={appCols}
      searchPlaceholder="Search manufacturer, country or reference…"
      emptyText="No manufacturer partnership applications submitted yet."
      filters={[
        {
          columnId: "status",
          label: "Status",
          options: [
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Under review" },
            { value: "more_info_requested", label: "More info requested" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ],
        },
      ]}
    />
  );
}

export function ApplicationReviewForm({
  applicationId,
  initialStatus,
  hasLinkedManufacturer,
}: {
  applicationId: string;
  initialStatus: "submitted" | "under_review" | "more_info_requested" | "approved" | "rejected";
  hasLinkedManufacturer: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [createDir, setCreateDir] = React.useState(!hasLinkedManufacturer);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await reviewManufacturerApplication({
          applicationId,
          status,
          createDirectoryRecord: status === "approved" && createDir,
          noteToApplicant: note,
        });
        setBusy(false);
        if (r.ok) { toast.success("Application status updated"); setNote(""); router.refresh(); } else toast.error(r.error);
      }}
    >
      <div>
        <label className="label">Approval workflow decision</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="field">
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="more_info_requested">More information requested</option>
          <option value="approved">Approved for representation discussion</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {status === "approved" && !hasLinkedManufacturer && (
        <label className="flex items-start gap-2 rounded-md bg-steel-50 p-3 text-xs text-charcoal">
          <input type="checkbox" checked={createDir} onChange={(e) => setCreateDir(e.target.checked)} className="mt-0.5 size-4 accent-[#00447B]" />
          <span>
            Add to internal <strong>Manufacturer Directory</strong> (stage: <em>In discussion</em>). This does <strong>not</strong> grant portal login or access to any private client/commercial data.
          </span>
        </label>
      )}
      <div>
        <label className="label">Optional email message to applicant</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Leave blank for internal-only status update, or enter a message to email the manufacturer…"
          className="field text-sm"
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy && <Loader2 className="animate-spin" />} Update application
      </Button>
    </form>
  );
}

