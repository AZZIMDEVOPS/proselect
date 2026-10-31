"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { markNotificationsRead, respondToQuotation, sendMessage, updatePassword } from "@/lib/actions/portal";
import { cn, formatDate } from "@/lib/utils";

export interface Msg { id: string; body: string; from_staff: boolean; created_at: string; sender?: string }

export function MessageThread({ rfqId, messages, viewer }: { rfqId: string; messages: Msg[]; viewer: "client" | "staff" }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const mine = (m: Msg) => (viewer === "staff") === m.from_staff;
  return (
    <div>
      <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 && <li className="rounded-md bg-steel-50 p-4 text-sm text-steel-600">No messages yet. Questions about this inquiry can be sent here.</li>}
        {messages.map((m) => (
          <li key={m.id} className={cn("max-w-[88%] rounded-lg px-4 py-3 text-sm", mine(m) ? "ml-auto bg-navy-900 text-white" : "bg-steel-100 text-charcoal")}>
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p className={cn("mt-1.5 text-[11px]", mine(m) ? "text-steel-300" : "text-steel-500")}>{m.from_staff ? "ProSelect" : m.sender ?? "Client"} · {formatDate(m.created_at, true)}</p>
          </li>
        ))}
      </ul>
      <form className="mt-4 flex gap-2" onSubmit={async (e) => {
        e.preventDefault(); if (!body.trim()) return; setBusy(true);
        const r = await sendMessage(rfqId, body); setBusy(false);
        if (r.ok) { setBody(""); router.refresh(); } else toast.error(r.error);
      }}>
        <label htmlFor="msg" className="sr-only">Message</label>
        <textarea id="msg" rows={2} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" className="field flex-1" />
        <Button type="submit" disabled={busy || !body.trim()} aria-label="Send message">{busy ? <Loader2 className="animate-spin" /> : <Send />}</Button>
      </form>
    </div>
  );
}

export function QuotationResponse({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const act = async (d: "accepted" | "revision_requested" | "declined") => {
    setBusy(true); const r = await respondToQuotation(id, d, note); setBusy(false);
    if (r.ok) { toast.success(d === "accepted" ? "Acceptance recorded" : d === "declined" ? "Quotation declined" : "Revision request sent"); router.refresh(); } else toast.error(r.error);
  };
  return (
    <div className="space-y-4">
      <div><label htmlFor="qnote" className="label">Note to ProSelect <span className="font-normal text-steel-500">(required for revisions)</span></label>
        <textarea id="qnote" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="field" maxLength={2000} /></div>
      <div className="flex flex-wrap gap-3">
        <ConfirmDialog title="Accept this quotation?" confirmLabel="Record acceptance" onConfirm={() => act("accepted")}
          description="Your acceptance will be recorded and sent to ProSelect. Contractual workflows (contract, invoicing, ordering) begin only when authorised by ProSelect."
          trigger={<Button disabled={busy}>Accept quotation</Button>} />
        <Button variant="outline" disabled={busy} onClick={() => act("revision_requested")}>Request revisions</Button>
        <ConfirmDialog danger title="Decline this quotation?" confirmLabel="Decline" onConfirm={() => act("declined")}
          description="ProSelect will be notified that you are not proceeding with this quotation."
          trigger={<Button variant="ghost" disabled={busy} className="text-red-700">Decline</Button>} />
      </div>
    </div>
  );
}

export function MarkReadButton() {
  const router = useRouter();
  return <Button variant="outline" size="sm" onClick={async () => { await markNotificationsRead(); router.refresh(); }}>Mark all as read</Button>;
}

export function PasswordForm() {
  const [pw, setPw] = React.useState(""); const [busy, setBusy] = React.useState(false);
  return (
    <form className="max-w-sm space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await updatePassword(pw); setBusy(false); if (r.ok) { toast.success("Password updated"); setPw(""); } else toast.error(r.error); }}>
      <div><label htmlFor="npw" className="label">New password</label><input id="npw" type="password" autoComplete="new-password" minLength={10} required value={pw} onChange={(e) => setPw(e.target.value)} className="field" /><p className="hint">10+ characters, upper &amp; lower case, and a number.</p></div>
      <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Update password</Button>
    </form>
  );
}

