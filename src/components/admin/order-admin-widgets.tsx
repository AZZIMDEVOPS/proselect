"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminDataTable, type AdminColumnDef } from "./data-table";
import { StatusBadge } from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { updateOrderStage } from "@/lib/actions/admin";
import { ORDER_STAGES } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export interface OrderAdminRow {
  id: string;
  reference: string;
  title: string | null;
  client_name: string;
  stage: string;
  delivery_site: string | null;
  estimated_delivery: string | null;
  value_amount: number | null;
  currency: string;
  updated_at: string;
}

const columns: AdminColumnDef<OrderAdminRow>[] = [
  {
    accessorKey: "reference",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/admin/orders/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
        {row.original.reference}
      </Link>
    ),
  },
  {
    accessorKey: "client_name",
    header: "Client / Project",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-charcoal">{row.original.client_name}</p>
        {row.original.title && <p className="text-xs text-steel-500">{row.original.title}</p>}
      </div>
    ),
  },
  {
    accessorKey: "stage",
    header: "Current Stage",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge s={row.original.stage} />,
  },
  { accessorKey: "delivery_site", header: "Delivery Site", cell: ({ row }) => row.original.delivery_site ?? "—" },
  {
    accessorKey: "estimated_delivery",
    header: "Est. Delivery",
    cell: ({ row }) => formatDate(row.original.estimated_delivery),
  },
  {
    accessorKey: "value_amount",
    header: "Contract Value",
    cell: ({ row }) =>
      row.original.value_amount != null ? (
        <span className="font-bold">{formatMoney(row.original.value_amount, row.original.currency)}</span>
      ) : (
        "—"
      ),
  },
  { accessorKey: "updated_at", header: "Updated", cell: ({ row }) => formatDate(row.original.updated_at) },
];

export function OrdersAdminTable({ rows }: { rows: OrderAdminRow[] }) {
  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search by order ref, client or site…"
      emptyText="No confirmed orders yet. Authorise an order from an approved quotation."
      filters={[
        {
          columnId: "stage",
          label: "Stage",
          options: ORDER_STAGES.map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}

export function OrderMilestoneRecorder({
  orderId,
  currentStage,
  estimatedDelivery,
}: {
  orderId: string;
  currentStage: string;
  estimatedDelivery: string | null;
}) {
  const router = useRouter();
  const [stage, setStage] = React.useState(currentStage);
  const [location, setLocation] = React.useState("");
  const [note, setNote] = React.useState("");
  const [est, setEst] = React.useState(estimatedDelivery ?? "");
  const [visible, setVisible] = React.useState(true);
  const [notify, setNotify] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await updateOrderStage({
          orderId,
          stage,
          location,
          note,
          estimated_delivery: est || null,
          visible_to_client: visible,
          notify_client: notify,
        });
        setBusy(false);
        if (r.ok) {
          toast.success("Procurement milestone recorded");
          setNote("");
          router.refresh();
        } else toast.error(r.error);
      }}
    >
      <div>
        <label htmlFor="ord-stage" className="label">Procurement / Shipment stage</label>
        <select id="ord-stage" value={stage} onChange={(e) => setStage(e.target.value)} className="field">
          {ORDER_STAGES.map(([k, l], i) => (
            <option key={k} value={k}>
              {String(i + 1).padStart(2, "0")} — {l}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ord-loc" className="label">Milestone location</label>
          <input
            id="ord-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Port of Mombasa / Nairobi ICD"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="ord-est" className="label">Updated est. delivery</label>
          <input id="ord-est" type="date" value={est} onChange={(e) => setEst(e.target.value)} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="ord-note" className="label">Milestone update / clearance progress note</label>
        <textarea
          id="ord-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Vessel ETA, KPA/KRA port clearance status, dispatch truck details…"
          className="field text-sm"
        />
      </div>
      <div className="space-y-2 text-xs">
        <label className="flex items-center gap-2 font-medium text-charcoal">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="size-4 accent-[#00447B]" />
          Display this milestone note on client&apos;s Order Tracking timeline
        </label>
        <label className="flex items-center gap-2 font-medium text-charcoal">
          <input
            type="checkbox"
            checked={notify && visible}
            disabled={!visible}
            onChange={(e) => setNotify(e.target.checked)}
            className="size-4 accent-[#00447B]"
          />
          Notify client immediately (in-app portal alert + transactional email)
        </label>
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy && <Loader2 className="animate-spin" />} Record milestone &amp; update stage
      </Button>
    </form>
  );
}

