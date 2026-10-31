"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminDataTable, type AdminColumnDef } from "./data-table";
import { StatusBadge } from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { saveSiteSettings, updateLeadStatus, updateUserRole } from "@/lib/actions/admin";
import type { Role } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// ================================================================ LEADS
export interface LeadAdminRow {
  id: string;
  reference: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  category: string | null;
  message: string;
  status: "new" | "contacted" | "qualified" | "converted" | "closed";
  created_at: string;
}

export function LeadsAdminTable({ rows }: { rows: LeadAdminRow[] }) {
  const router = useRouter();
  const columns: AdminColumnDef<LeadAdminRow>[] = [
    { accessorKey: "reference", header: "Ref", cell: ({ row }) => <span className="font-bold text-navy-900">{row.original.reference}</span> },
    {
      accessorKey: "name",
      header: "Contact",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.name}{row.original.company ? ` (${row.original.company})` : ""}</p>
          <p className="text-xs text-steel-500">{row.original.email}{row.original.phone ? ` · ${row.original.phone}` : ""}</p>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category ?? "—" },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => <p className="max-w-xs whitespace-pre-wrap text-xs text-steel-600">{row.original.message}</p>,
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <select
          aria-label={`Status for ${row.original.reference}`}
          value={row.original.status}
          onChange={async (e) => {
            const st = e.target.value as LeadAdminRow["status"];
            const r = await updateLeadStatus({ leadId: row.original.id, status: st });
            if (r.ok) { toast.success("Lead updated"); router.refresh(); } else toast.error(r.error);
          }}
          className="field !w-auto !py-1 text-xs font-semibold"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted to RFQ</option>
          <option value="closed">Closed</option>
        </select>
      ),
    },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => formatDate(row.original.created_at, true) },
  ];

  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search lead name, company, email or message…"
      emptyText="No contact form leads submitted yet."
      filters={[
        {
          columnId: "status",
          label: "Status",
          options: [
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "qualified", label: "Qualified" },
            { value: "converted", label: "Converted" },
            { value: "closed", label: "Closed" },
          ],
        },
      ]}
    />
  );
}

// ================================================================ CMS SETTINGS
export function CmsSettingsForm({ initial }: { initial: Record<string, unknown> }) {
  const router = useRouter();
  const [phone, setPhone] = React.useState(String(initial["contact.phone"] ?? ""));
  const [email, setEmail] = React.useState(String(initial["contact.email"] ?? "info@proselectimports.com"));
  const [location, setLocation] = React.useState(String(initial["contact.location"] ?? "Nairobi, Kenya"));
  const [regNumber, setRegNumber] = React.useState(String(initial["company.registration_number"] ?? ""));
  const [kraPin, setKraPin] = React.useState(String(initial["company.kra_pin"] ?? ""));
  const [vatNumber, setVatNumber] = React.useState(String(initial["company.vat_number"] ?? ""));
  const [physicalAddress, setPhysicalAddress] = React.useState(String(initial["contact.physical_address"] ?? "Nairobi, Kenya"));
  const [namedContact, setNamedContact] = React.useState(String(initial["contact.named_contact"] ?? "Commercial & Procurement Desk"));
  const [mapUrl, setMapUrl] = React.useState(String(initial["contact.map_embed_url"] ?? ""));
  const [waEnabled, setWaEnabled] = React.useState(initial["whatsapp.enabled"] === true);
  const [waNumber, setWaNumber] = React.useState(String(initial["whatsapp.number"] ?? ""));
  const [waMessage, setWaMessage] = React.useState(String(initial["whatsapp.message"] ?? "Hello Proselect, I would like to discuss an equipment inquiry."));
  const [linkedin, setLinkedin] = React.useState(String(initial["social.linkedin"] ?? ""));
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await saveSiteSettings({
          "contact.phone": phone.trim(),
          "contact.email": email.trim(),
          "contact.location": location.trim(),
          "company.registration_number": regNumber.trim(),
          "company.kra_pin": kraPin.trim(),
          "company.vat_number": vatNumber.trim(),
          "contact.physical_address": physicalAddress.trim(),
          "contact.named_contact": namedContact.trim(),
          "contact.map_embed_url": mapUrl.trim(),
          "whatsapp.enabled": waEnabled,
          "whatsapp.number": waNumber.trim(),
          "whatsapp.message": waMessage.trim(),
          "social.linkedin": linkedin.trim(),
        });
        setBusy(false);
        if (r.ok) { toast.success("CMS settings published"); router.refresh(); } else toast.error(r.error);
      }}
    >
      <div className="rounded-xl border border-steel-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-navy-900">Corporate Compliance &amp; Entity Display</h3>
        <p className="text-xs text-steel-500">Per Brand Guidelines v1.0 Section 11, registration details are displayed in the footer and document templates once verified.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">BRS Registration Number</label>
            <input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="e.g. CPR/202X/..." className="field" />
          </div>
          <div>
            <label className="label">KRA PIN</label>
            <input value={kraPin} onChange={(e) => setKraPin(e.target.value)} placeholder="e.g. P051XXXXXX" className="field" />
          </div>
          <div>
            <label className="label">VAT Registration Number</label>
            <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="Leave blank if not VAT-registered" className="field" />
          </div>
          <div>
            <label className="label">Named Human Contact / Desk</label>
            <input value={namedContact} onChange={(e) => setNamedContact(e.target.value)} placeholder="e.g. Commercial & Procurement Desk" className="field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Physical Address (not only P.O. Box)</label>
            <input value={physicalAddress} onChange={(e) => setPhysicalAddress(e.target.value)} placeholder="Office/yard location, Nairobi, Kenya" className="field" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Public telephone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Leave blank until confirmed, e.g. +254 700 000 000" className="field" />
          <p className="hint">Displayed on Contact page &amp; Footer only when populated.</p>
        </div>
        <div>
          <label className="label">Primary business email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        </div>
        <div>
          <label className="label">Headquarters location label</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="field" />
        </div>
        <div>
          <label className="label">Verified LinkedIn URL</label>
          <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/company/..." className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Confirmed Nairobi Office Map Embed URL</label>
          <input
            type="url"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=... (leave blank until physical office address is confirmed)"
            className="field font-mono text-xs"
          />
          <p className="hint">Per Proselect policy, no map is rendered on the Contact page until a verified address embed URL is entered here.</p>
        </div>
      </div>

      <div className="rounded-xl border border-steel-200 bg-steel-50 p-5">
        <label className="flex items-center gap-2.5 text-sm font-bold text-navy-900">
          <input type="checkbox" checked={waEnabled} onChange={(e) => setWaEnabled(e.target.checked)} className="size-4 accent-[#00447B]" />
          Enable floating WhatsApp B2B contact button on public pages
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label !text-xs">WhatsApp international number (digits / +254…)</label>
            <input value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="+2547..." className="field bg-white !py-2 text-sm" />
          </div>
          <div>
            <label className="label !text-xs">Default pre-filled inquiry greeting</label>
            <input value={waMessage} onChange={(e) => setWaMessage(e.target.value)} className="field bg-white !py-2 text-sm" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} Save &amp; publish CMS settings
      </Button>
    </form>
  );
}

// ================================================================ TEAM & ROLES
const ROLES: [Role, string][] = [
  ["super_admin", "Super Administrator"],
  ["admin", "Administrator"],
  ["sales_manager", "Sales Manager"],
  ["procurement_officer", "Procurement Officer"],
  ["operations_officer", "Operations Officer"],
  ["client", "Client"],
  ["manufacturer", "Manufacturer (no automatic access)"],
];

export interface ProfileAdminRow {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export function TeamRolesTable({ rows, viewerRole, viewerId }: { rows: ProfileAdminRow[]; viewerRole: Role; viewerId: string }) {
  const router = useRouter();
  const columns: AdminColumnDef<ProfileAdminRow>[] = [
    {
      accessorKey: "email",
      header: "User",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-navy-900">{row.original.full_name || row.original.email}</p>
          <p className="text-xs text-steel-500">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Assigned Role",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <select
          aria-label={`Role for ${row.original.email}`}
          disabled={row.original.id === viewerId}
          value={row.original.role}
          onChange={async (e) => {
            const nextRole = e.target.value as Role;
            const r = await updateUserRole({ profileId: row.original.id, role: nextRole, is_active: row.original.is_active });
            if (r.ok) { toast.success("Role updated"); router.refresh(); } else toast.error(r.error);
          }}
          className="field !w-auto !py-1 text-xs font-semibold"
        >
          {ROLES.filter(([r]) => viewerRole === "super_admin" || r !== "super_admin").map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Access",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={row.original.id === viewerId}
          onClick={async () => {
            const r = await updateUserRole({ profileId: row.original.id, role: row.original.role, is_active: !row.original.is_active });
            if (r.ok) { toast.success(row.original.is_active ? "Account suspended" : "Account activated"); router.refresh(); } else toast.error(r.error);
          }}
        >
          <StatusBadge s={row.original.is_active ? "approved" : "cancelled"} />
        </Button>
      ),
    },
    { accessorKey: "created_at", header: "Registered", cell: ({ row }) => formatDate(row.original.created_at) },
  ];

  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search user name or email…"
      filters={[{ columnId: "role", label: "Role", options: ROLES.map(([value, label]) => ({ value, label })) }]}
    />
  );
}
