"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminDataTable, type AdminColumnDef } from "./data-table";
import { StatusBadge } from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { recordManufacturerEngagement, updateRfqAdmin } from "@/lib/actions/admin";
import { DIVISION_LABEL, RFQ_STATUS_LABEL, type Division } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export interface RfqTableRow {
  id: string;
  reference: string;
  company_name: string;
  contact_person: string;
  category: Division | null;
  status: string;
  assignee_name: string | null;
  follow_up_at: string | null;
  created_at: string;
}

const columns: AdminColumnDef<RfqTableRow>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <Link href={`/admin/rfqs/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
        {row.original.reference}
      </Link>
    ),
  },
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-charcoal">{row.original.company_name}</p>
        <p className="text-xs text-steel-500">{row.original.contact_person}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Division",
    filterFn: "equalsString",
    cell: ({ row }) => (row.original.category ? DIVISION_LABEL[row.original.category] : "Custom / Mixed"),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge s={row.original.status} />,
  },
  {
    accessorKey: "assignee_name",
    header: "Assigned To",
    cell: ({ row }) => row.original.assignee_name ?? <span className="text-xs text-steel-400">Unassigned</span>,
  },
  {
    accessorKey: "follow_up_at",
    header: "Follow-up",
    cell: ({ row }) => (row.original.follow_up_at ? formatDate(row.original.follow_up_at) : "—"),
  },
  {
    accessorKey: "created_at",
    header: "Received",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
];

export function RfqAdminTable({ rows }: { rows: RfqTableRow[] }) {
  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search by reference, company or contact…"
      emptyText="No RFQs match the selected filters."
      filters={[
        {
          columnId: "category",
          label: "Division",
          options: Object.entries(DIVISION_LABEL).map(([value, label]) => ({ value, label })),
        },
        {
          columnId: "status",
          label: "Status",
          options: Object.entries(RFQ_STATUS_LABEL).map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}

export function RfqWorkflowForm({
  rfqId,
  initialStatus,
  initialAssignedTo,
  initialFollowUp,
  staff,
}: {
  rfqId: string;
  initialStatus: string;
  initialAssignedTo: string | null;
  initialFollowUp: string | null;
  staff: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [assignedTo, setAssignedTo] = React.useState(initialAssignedTo ?? "");
  const [followUp, setFollowUp] = React.useState(initialFollowUp ? initialFollowUp.slice(0, 10) : "");
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await updateRfqAdmin(rfqId, {
          status,
          assigned_to: assignedTo || null,
          follow_up_at: followUp ? new Date(followUp).toISOString() : null,
        });
        setBusy(false);
        if (r.ok) { toast.success("RFQ workflow updated"); router.refresh(); } else toast.error(r.error);
      }}
    >
      <div>
        <label htmlFor="rfq-status" className="label">Inquiry status</label>
        <select id="rfq-status" value={status} onChange={(e) => setStatus(e.target.value)} className="field">
          {Object.entries(RFQ_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="rfq-assign" className="label">Assigned team member</label>
        <select id="rfq-assign" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="field">
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="rfq-followup" className="label">Follow-up date</label>
        <input id="rfq-followup" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="field" />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy && <Loader2 className="animate-spin" />} Save workflow changes
      </Button>
    </form>
  );
}

export function ManufacturerEngagementForm({
  rfqId,
  manufacturers,
}: {
  rfqId: string;
  manufacturers: { id: string; name: string; country: string | null }[];
}) {
  const router = useRouter();
  const [mfrId, setMfrId] = React.useState("");
  const [status, setStatus] = React.useState<"contacted" | "awaiting_response" | "quote_received" | "declined" | "confirmed">("contacted");
  const [followUp, setFollowUp] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!manufacturers.length) {
    return (
      <p className="text-xs text-steel-600">
        No manufacturers in directory yet. <Link href="/admin/manufacturers" className="font-semibold text-[#00447B] underline">Add a manufacturer</Link> first.
      </p>
    );
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-steel-200 bg-steel-50 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await recordManufacturerEngagement({
          rfq_id: rfqId,
          manufacturer_id: mfrId,
          status,
          note,
          follow_up_at: followUp ? new Date(followUp).toISOString() : null,
        });
        setBusy(false);
        if (r.ok) {
          toast.success("Manufacturer engagement logged");
          setNote("");
          router.refresh();
        } else toast.error(r.error);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="eng-mfr" className="label !text-xs">Manufacturer</label>
          <select id="eng-mfr" required value={mfrId} onChange={(e) => setMfrId(e.target.value)} className="field !py-2 text-sm">
            <option value="">Select manufacturer…</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.country ? ` (${m.country})` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="eng-status" className="label !text-xs">Engagement status</label>
          <select id="eng-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="field !py-2 text-sm">
            <option value="contacted">Contacted</option>
            <option value="awaiting_response">Awaiting response</option>
            <option value="quote_received">Factory quote received</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="eng-fu" className="label !text-xs">Next follow-up</label>
        <input id="eng-fu" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="field !py-2 text-sm" />
      </div>
      <div>
        <label htmlFor="eng-note" className="label !text-xs">Factory communication note (internal)</label>
        <textarea id="eng-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="field text-sm" placeholder="Spec confirmation, lead time, factory contact…" />
      </div>
      <Button type="submit" size="sm" variant="navy" disabled={busy || !mfrId}>
        {busy && <Loader2 className="animate-spin" />} Log manufacturer engagement
      </Button>
    </form>
  );
}

