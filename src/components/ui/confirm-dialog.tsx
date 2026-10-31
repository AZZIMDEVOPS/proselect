"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";

export function ConfirmDialog({
  trigger, title, description, confirmLabel = "Confirm", danger, onConfirm,
}: {
  trigger: React.ReactNode; title: string; description: string; confirmLabel?: string; danger?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger asChild>{trigger}</D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[80] bg-navy-950/60 backdrop-blur-sm" />
        <D.Content className="fixed left-1/2 top-1/2 z-[81] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lift">
          <D.Title className="text-lg font-bold text-navy-900">{title}</D.Title>
          <D.Description className="mt-2 text-sm text-steel-600">{description}</D.Description>
          <div className="mt-6 flex justify-end gap-3">
            <D.Close asChild><Button variant="ghost">Cancel</Button></D.Close>
            <Button
              variant={danger ? "danger" : "primary"} disabled={busy}
              onClick={async () => { setBusy(true); try { await onConfirm(); setOpen(false); } finally { setBusy(false); } }}
            >
              {busy ? "Working…" : confirmLabel}
            </Button>
          </div>
          <D.Close aria-label="Close" className="absolute right-3 top-3 rounded p-1 text-steel-500 hover:bg-steel-100"><X className="size-4" /></D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

