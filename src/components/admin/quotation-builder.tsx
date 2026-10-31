"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileCheck2, Loader2, Lock, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { AdminDataTable, type AdminColumnDef } from "./data-table";
import { Panel, StatusBadge } from "@/components/dashboard/parts";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createOrderFromQuotation,
  createQuotationRevision,
  saveQuotation,
  sendQuotationToClient,
  type SaveQuotationInput,
} from "@/lib/actions/admin";
import { quoteTotals } from "@/lib/quote";
import { formatDate, formatMoney } from "@/lib/utils";

export interface QuotationRow {
  id: string;
  reference: string;
  version: number;
  company_name: string;
  rfq_reference: string;
  currency: string;
  total: number;
  status: string;
  validity_until: string | null;
  updated_at: string;
}

const columns: AdminColumnDef<QuotationRow>[] = [
  {
    accessorKey: "reference",
    header: "Quotation",
    cell: ({ row }) => (
      <Link href={`/admin/quotations/${row.original.id}`} className="font-extrabold text-navy-900 hover:text-[#00447B]">
        {row.original.reference} <span className="font-normal text-steel-500">v{row.original.version}</span>
      </Link>
    ),
  },
  { accessorKey: "company_name", header: "Client" },
  { accessorKey: "rfq_reference", header: "RFQ" },
  {
    accessorKey: "total",
    header: "Client Total",
    cell: ({ row }) => <span className="font-bold">{formatMoney(row.original.total, row.original.currency)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge s={row.original.status} />,
  },
  {
    accessorKey: "validity_until",
    header: "Valid Until",
    cell: ({ row }) => formatDate(row.original.validity_until),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => formatDate(row.original.updated_at),
  },
];

export function QuotationsAdminTable({ rows }: { rows: QuotationRow[] }) {
  return (
    <AdminDataTable
      data={rows}
      columns={columns}
      searchPlaceholder="Search by quotation ref, client or RFQ…"
      emptyText="No quotations created yet."
      filters={[
        {
          columnId: "status",
          label: "Status",
          options: [
            { value: "draft", label: "Draft" },
            { value: "sent", label: "Sent (awaiting response)" },
            { value: "accepted", label: "Accepted by client" },
            { value: "revision_requested", label: "Revision requested" },
            { value: "declined", label: "Declined" },
            { value: "expired", label: "Expired" },
          ],
        },
      ]}
    />
  );
}

export interface CatalogueOption {
  id: string;
  name: string;
  model: string | null;
}

export function QuotationBuilder({
  initial,
  catalogue,
  status = "draft",
  version = 1,
  reference,
  defaultOrderTitle,
  defaultDeliverySite,
  existingOrders = [],
}: {
  initial: SaveQuotationInput;
  catalogue: CatalogueOption[];
  status?: string;
  version?: number;
  reference?: string;
  defaultOrderTitle?: string;
  defaultDeliverySite?: string;
  existingOrders?: { id: string; reference: string; stage: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<SaveQuotationInput>(initial);
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [revNote, setRevNote] = React.useState("");
  const [ordTitle, setOrdTitle] = React.useState(defaultOrderTitle ?? "");
  const [ordSite, setOrdSite] = React.useState(defaultDeliverySite ?? "");
  const [ordDate, setOrdDate] = React.useState("");

  const readOnly = Boolean(form.id && status !== "draft");

  const totals = quoteTotals(
    form.items.map((i) => ({ description: i.description, quantity: Number(i.quantity) || 0, unit_price: Number(i.unit_price) || 0 })),
    Number(form.logistics_charge) || 0,
    Number(form.other_charges) || 0,
    Number(form.tax_rate) || 0,
  );
  const internalTotal =
    (Number(form.internal.manufacturer_cost_total) || 0) +
    (Number(form.internal.logistics_cost_total) || 0) +
    (Number(form.internal.other_internal_costs) || 0);
  const netMargin = totals.taxable - internalTotal;
  const marginPct = totals.taxable > 0 ? (netMargin / totals.taxable) * 100 : 0;

  const setItem = (idx: number, patch: Partial<SaveQuotationInput["items"][number]>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, n) => (n === idx ? { ...it, ...patch } : it)) }));

  const handleSave = async () => {
    setSaving(true);
    const res = await saveQuotation(form);
    setSaving(false);
    if (res.ok) {
      toast.success(form.id ? "Quotation saved" : "Draft quotation created");
      if (!form.id) router.push(`/admin/quotations/${res.data.id}`);
      else router.refresh();
    } else toast.error(res.error);
  };

  return (
    <div className="space-y-6">
      {form.id && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-steel-200 bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge s={status} />
            <span className="text-sm text-steel-600">
              Version <strong>v{version}</strong>
              {readOnly && " · Locked while issued — start a revision to modify line items or terms."}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/quotations/${form.id}/pdf`}><Download /> Preview / Download PDF</a>
            </Button>
            {status === "draft" && (
              <ConfirmDialog
                title={`Send ${reference ?? "quotation"} (v${version}) to client?`}
                description="This generates the branded PDF quotation, emails it to the client, unlocks it in their Client Portal and logs a version snapshot. Internal costs are never included."
                confirmLabel="Issue & email quotation"
                onConfirm={async () => {
                  setSending(true);
                  const saved = await saveQuotation(form);
                  if (!saved.ok) { setSending(false); toast.error(saved.error); return; }
                  const sent = await sendQuotationToClient(form.id!);
                  setSending(false);
                  if (sent.ok) { toast.success("Quotation sent to client"); router.refresh(); } else toast.error(sent.error);
                }}
                trigger={
                  <Button size="sm" disabled={sending}>
                    {sending ? <Loader2 className="animate-spin" /> : <Send />} Send to client
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}

      {/* CLIENT-FACING LINE ITEMS */}
      <Panel title="Client-Facing Quotation Line Items">
        <div className="space-y-4">
          {form.items.map((it, idx) => (
            <div key={idx} className="grid gap-3 rounded-lg border border-steel-200 bg-steel-50/60 p-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="label !text-xs">Catalogue equipment (optional)</label>
                <select
                  disabled={readOnly}
                  value={it.product_id ?? ""}
                  onChange={(e) => {
                    const pid = e.target.value || null;
                    const prod = catalogue.find((c) => c.id === pid);
                    setItem(idx, {
                      product_id: pid,
                      description: prod ? `${prod.name}${prod.model ? ` (${prod.model})` : ""}` : it.description,
                    });
                  }}
                  className="field !py-2 text-sm"
                >
                  <option value="">Custom line item</option>
                  {catalogue.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="label !text-xs">Client-facing description</label>
                <input
                  disabled={readOnly}
                  value={it.description}
                  onChange={(e) => setItem(idx, { description: e.target.value })}
                  placeholder="Equipment specification & configuration…"
                  className="field !py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="label !text-xs">Qty</label>
                <input
                  disabled={readOnly}
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                  className="field !py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label !text-xs">Unit price ({form.currency})</label>
                <input
                  disabled={readOnly}
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.unit_price}
                  onChange={(e) => setItem(idx, { unit_price: Number(e.target.value) })}
                  className="field !py-2 text-sm"
                />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                {!readOnly && form.items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700"
                    aria-label="Remove line"
                    onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, n) => n !== idx) }))}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm((f) => ({ ...f, items: [...f.items, { product_id: null, description: "", quantity: 1, unit_price: 0 }] }))}
            >
              <Plus /> Add line item
            </Button>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* CLIENT-FACING CHARGES & COMMERCIAL TERMS */}
        <Panel title="Disclosed Charges, Validity & Commercial Terms (Client-Facing)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Currency</label>
              <select
                disabled={readOnly}
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as SaveQuotationInput["currency"] }))}
                className="field"
              >
                {["USD", "KES", "EUR", "GBP", "CNY"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valid until</label>
              <input
                disabled={readOnly}
                type="date"
                value={form.validity_until ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, validity_until: e.target.value || null }))}
                className="field"
              />
            </div>
            <div>
              <label className="label">Disclosed logistics &amp; shipping ({form.currency})</label>
              <input
                disabled={readOnly}
                type="number"
                min={0}
                step="0.01"
                value={form.logistics_charge}
                onChange={(e) => setForm((f) => ({ ...f, logistics_charge: Number(e.target.value) }))}
                className="field"
              />
            </div>
            <div>
              <label className="label">Incoterm</label>
              <input
                disabled={readOnly}
                value={form.incoterm ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, incoterm: e.target.value }))}
                placeholder="e.g. CIF Mombasa / DDP Nairobi"
                className="field"
              />
            </div>
            <div>
              <label className="label">Other disclosed charges label</label>
              <input
                disabled={readOnly}
                value={form.other_charges_label ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, other_charges_label: e.target.value }))}
                placeholder="e.g. Port clearance & commissioning"
                className="field"
              />
            </div>
            <div>
              <label className="label">Other disclosed charges ({form.currency})</label>
              <input
                disabled={readOnly}
                type="number"
                min={0}
                step="0.01"
                value={form.other_charges}
                onChange={(e) => setForm((f) => ({ ...f, other_charges: Number(e.target.value) }))}
                className="field"
              />
            </div>
            <div>
              <label className="label">Tax label</label>
              <input
                disabled={readOnly}
                value={form.tax_label ?? "VAT"}
                onChange={(e) => setForm((f) => ({ ...f, tax_label: e.target.value }))}
                className="field"
              />
            </div>
            <div>
              <label className="label">Tax rate (%)</label>
              <input
                disabled={readOnly}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.tax_rate}
                onChange={(e) => setForm((f) => ({ ...f, tax_rate: Number(e.target.value) }))}
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Delivery estimate</label>
              <input
                disabled={readOnly}
                value={form.delivery_estimate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, delivery_estimate: e.target.value }))}
                placeholder="e.g. 8–10 weeks from contract execution & deposit"
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Logistics &amp; shipping arrangement</label>
              <input
                disabled={readOnly}
                value={form.logistics_estimate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logistics_estimate: e.target.value }))}
                placeholder="e.g. 40ft HC container via Mombasa Port + flatbed transport to Nairobi"
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Payment terms</label>
              <input
                disabled={readOnly}
                value={form.payment_terms ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
                placeholder="e.g. 40% upon contract signing, 50% prior to factory dispatch, 10% on delivery"
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Commercial terms &amp; warranty notes</label>
              <textarea
                disabled={readOnly}
                rows={3}
                value={form.commercial_terms ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, commercial_terms: e.target.value }))}
                className="field"
              />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-steel-50 p-4 text-sm">
            <div className="flex justify-between"><span>Equipment subtotal</span><span className="font-semibold">{formatMoney(totals.subtotal, form.currency)}</span></div>
            <div className="mt-1 flex justify-between"><span>Disclosed logistics &amp; other</span><span>{formatMoney(totals.logistics + totals.other, form.currency)}</span></div>
            <div className="mt-1 flex justify-between"><span>{form.tax_label || "Tax"} ({form.tax_rate}%)</span><span>{formatMoney(totals.tax, form.currency)}</span></div>
            <div className="mt-2 flex justify-between border-t border-steel-200 pt-2 text-base font-extrabold text-[#00447B]">
              <span>Client Total ({form.currency})</span>
              <span>{formatMoney(totals.total, form.currency)}</span>
            </div>
          </div>
        </Panel>

        {/* STRICTLY INTERNAL COSTING PANEL */}
        <div className="space-y-6">
          <section className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-card">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
              <Lock className="size-4" aria-hidden /> Internal Costing — Strictly Confidential (Staff Only)
            </div>
            <p className="mt-1 text-xs text-amber-800">
              Stored in an isolated RLS-protected table (<code className="rounded bg-white px-1">quotation_internal_costs</code>). Never visible in the Client Portal or PDF quotations.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label !text-xs">Manufacturer factory cost ({form.currency})</label>
                <input
                  disabled={readOnly}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.internal.manufacturer_cost_total}
                  onChange={(e) => setForm((f) => ({ ...f, internal: { ...f.internal, manufacturer_cost_total: Number(e.target.value) } }))}
                  className="field bg-white"
                />
              </div>
              <div>
                <label className="label !text-xs">Internal freight &amp; clearance cost ({form.currency})</label>
                <input
                  disabled={readOnly}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.internal.logistics_cost_total}
                  onChange={(e) => setForm((f) => ({ ...f, internal: { ...f.internal, logistics_cost_total: Number(e.target.value) } }))}
                  className="field bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label !text-xs">Other internal procurement costs ({form.currency})</label>
                <input
                  disabled={readOnly}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.internal.other_internal_costs}
                  onChange={(e) => setForm((f) => ({ ...f, internal: { ...f.internal, other_internal_costs: Number(e.target.value) } }))}
                  className="field bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label !text-xs">Internal costing &amp; factory quote reference notes</label>
                <textarea
                  disabled={readOnly}
                  rows={3}
                  value={form.internal.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, internal: { ...f.internal, notes: e.target.value } }))}
                  className="field bg-white text-sm"
                  placeholder="EXW quote reference, FX rate assumption, duty calculation notes…"
                />
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-amber-200 bg-white p-3.5 text-sm">
              <div className="flex justify-between text-steel-600"><span>Client pre-tax revenue</span><span>{formatMoney(totals.taxable, form.currency)}</span></div>
              <div className="mt-1 flex justify-between text-steel-600"><span>Total internal cost</span><span>{formatMoney(internalTotal, form.currency)}</span></div>
              <div className={`mt-2 flex justify-between border-t border-steel-100 pt-2 font-bold ${netMargin >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                <span>Projected gross margin</span>
                <span>{formatMoney(netMargin, form.currency)} ({marginPct.toFixed(1)}%)</span>
              </div>
            </div>
          </section>

          {!readOnly && (
            <Button type="button" size="lg" onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="animate-spin" />} {form.id ? "Save draft quotation" : "Create draft quotation"}
            </Button>
          )}

          {/* REVISION WORKFLOW */}
          {form.id && status !== "draft" && (
            <Panel title="Record Quotation Revision">
              <p className="text-xs text-steel-600">
                Starting a revision increments the version to <strong>v{version + 1}</strong> and unlocks the builder while preserving previous snapshots.
              </p>
              <input
                value={revNote}
                onChange={(e) => setRevNote(e.target.value)}
                placeholder="Reason for revision (e.g. updated quantity or CIF terms)…"
                className="field mt-3 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={async () => {
                  const r = await createQuotationRevision(form.id!, revNote);
                  if (r.ok) { toast.success(`Revision v${version + 1} opened`); router.refresh(); } else toast.error(r.error);
                }}
              >
                <RefreshCw /> Start revision v{version + 1}
              </Button>
            </Panel>
          )}

          {/* AUTHORISE ORDER WORKFLOW */}
          {form.id && (status === "accepted" || status === "sent") && (
            <Panel title="Authorise Confirmed Order & Contractual Workflow">
              {existingOrders.length > 0 ? (
                <div className="space-y-2 text-sm">
                  <p className="text-steel-600">Active order(s) linked to this quotation:</p>
                  {existingOrders.map((o) => (
                    <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-md border border-steel-200 p-3 font-bold text-navy-900 hover:border-[#00447B]">
                      <span>{o.reference}</span>
                      <StatusBadge s={o.stage} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-steel-600">
                    Client portal acceptance never creates a binding order automatically. Only authorised commercial staff may initiate an order once contractual requirements are satisfied.
                  </p>
                  <div>
                    <label className="label !text-xs">Order title</label>
                    <input value={ordTitle} onChange={(e) => setOrdTitle(e.target.value)} className="field !py-2 text-sm" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label !text-xs">Delivery site</label>
                      <input value={ordSite} onChange={(e) => setOrdSite(e.target.value)} className="field !py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label !text-xs">Estimated delivery date</label>
                      <input type="date" value={ordDate} onChange={(e) => setOrdDate(e.target.value)} className="field !py-2 text-sm" />
                    </div>
                  </div>
                  <ConfirmDialog
                    title="Authorise commercial order?"
                    description="This creates a tracked order at stage 'Contract Signed', marks the RFQ as Won and notifies the client."
                    confirmLabel="Authorise & create order"
                    onConfirm={async () => {
                      const r = await createOrderFromQuotation({
                        quotationId: form.id!,
                        title: ordTitle,
                        delivery_site: ordSite,
                        estimated_delivery: ordDate || null,
                      });
                      if (r.ok) { toast.success("Order created"); router.push(`/admin/orders/${r.data.id}`); } else toast.error(r.error);
                    }}
                    trigger={<Button size="sm" variant="navy"><FileCheck2 /> Authorise &amp; create order</Button>}
                  />
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

