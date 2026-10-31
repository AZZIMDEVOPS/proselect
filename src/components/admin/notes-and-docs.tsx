"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, Lock, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { addInternalNote, deleteDocument, uploadClientDocument } from "@/lib/actions/admin";
import { DOC_TYPE_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export interface InternalNoteItem {
  id: string;
  body: string;
  created_at: string;
  author_name?: string | null;
}

export function InternalNotesPanel({
  entityType,
  entityId,
  notes,
}: {
  entityType: "rfq" | "client" | "manufacturer" | "order" | "quotation" | "lead" | "application";
  entityId: string;
  notes: InternalNoteItem[];
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
        <Lock className="size-3.5" aria-hidden /> Internal staff-only notes — never visible to clients or manufacturers.
      </p>
      <ul className="max-h-72 space-y-2.5 overflow-y-auto">
        {notes.length === 0 ? (
          <li className="rounded-md bg-steel-50 p-3 text-xs text-steel-500">No internal notes recorded yet.</li>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-steel-200 bg-steel-50 p-3 text-sm">
              <p className="whitespace-pre-wrap text-charcoal">{n.body}</p>
              <p className="mt-1.5 text-[11px] text-steel-500">
                {n.author_name ?? "Staff"} · {formatDate(n.created_at, true)}
              </p>
            </li>
          ))
        )}
      </ul>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (body.trim().length < 2) return;
          setBusy(true);
          const res = await addInternalNote({ entity_type: entityType, entity_id: entityId, body });
          setBusy(false);
          if (res.ok) {
            setBody("");
            toast.success("Internal note saved");
            router.refresh();
          } else toast.error(res.error);
        }}
      >
        <label htmlFor={`note-${entityId}`} className="sr-only">Add internal note</label>
        <textarea
          id={`note-${entityId}`}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add internal commercial, technical or follow-up note…"
          className="field text-sm"
        />
        <Button type="submit" size="sm" variant="navy" disabled={busy || body.trim().length < 2}>
          {busy && <Loader2 className="animate-spin" />} Add internal note
        </Button>
      </form>
    </div>
  );
}

export interface AdminDocItem {
  id: string;
  title: string;
  doc_type: string;
  visible_to_client: boolean;
  created_at: string;
}

export function AdminDocumentManager({
  clientId,
  rfqId,
  orderId,
  quotationId,
  documents,
}: {
  clientId: string | null;
  rfqId?: string;
  orderId?: string;
  quotationId?: string;
  documents: AdminDocItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="text-sm text-steel-600">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-steel-200 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy-900">{d.title}</p>
                <p className="text-xs text-steel-500">
                  {DOC_TYPE_LABEL[d.doc_type] ?? d.doc_type} · {d.visible_to_client ? "Client visible" : "Staff only"} · {formatDate(d.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <a href={`/api/documents/${d.id}`} aria-label={`Download ${d.title}`}><Download /></a>
                </Button>
                <ConfirmDialog
                  danger
                  title="Delete document?"
                  description={`Permanently delete “${d.title}” from private storage?`}
                  confirmLabel="Delete"
                  onConfirm={async () => {
                    const r = await deleteDocument(d.id);
                    if (r.ok) { toast.success("Document deleted"); router.refresh(); } else toast.error(r.error);
                  }}
                  trigger={<Button variant="ghost" size="sm" className="text-red-700" aria-label={`Delete ${d.title}`}><Trash2 /></Button>}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!clientId ? (
        <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
          Create a quotation for this inquiry first to link a client folder before uploading private documents.
        </p>
      ) : (
        <form
          ref={formRef}
          className="space-y-3 rounded-lg border border-steel-200 bg-steel-50 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            const r = await uploadClientDocument(fd);
            setBusy(false);
            if (r.ok) {
              toast.success("Document uploaded");
              formRef.current?.reset();
              router.refresh();
            } else toast.error(r.error);
          }}
        >
          <input type="hidden" name="client_id" value={clientId} />
          {rfqId && <input type="hidden" name="rfq_id" value={rfqId} />}
          {orderId && <input type="hidden" name="order_id" value={orderId} />}
          {quotationId && <input type="hidden" name="quotation_id" value={quotationId} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-title" className="label !text-xs">Document title</label>
              <input id="doc-title" name="title" required className="field !py-2 text-sm" placeholder="e.g. Commercial Invoice #104" />
            </div>
            <div>
              <label htmlFor="doc-type" className="label !text-xs">Document type</label>
              <select id="doc-type" name="doc_type" className="field !py-2 text-sm" defaultValue="shipping_document">
                {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="doc-file" className="label !text-xs">File (PDF, JPG, PNG, DOCX, XLSX · max 25 MB)</label>
            <input id="doc-file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" className="block w-full text-xs text-steel-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-charcoal">
            <input type="checkbox" name="visible_to_client" value="true" defaultChecked className="size-4 accent-[#00447B]" />
            Visible to client in Document Centre (uncheck for internal staff-only file)
          </label>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload document
          </Button>
        </form>
      )}
    </div>
  );
}

