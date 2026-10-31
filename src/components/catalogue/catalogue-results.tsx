"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/types";

const MAX = 4;

export function CatalogueResults({ products, layout }: { products: Product[]; layout: "grid" | "list" }) {
  const [sel, setSel] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const chosen = sel.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX ? [...s, id] : s));
  const labels = [...new Set(chosen.flatMap((p) => p.specs.map((s) => s.label)))];

  return (
    <>
      <div className={layout === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-5"}>
        {products.map((p) => (
          <ProductCard key={p.id} p={p} layout={layout} compare={
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-steel-600">
              <input type="checkbox" className="size-4 accent-[#00447B]" checked={sel.includes(p.id)} disabled={!sel.includes(p.id) && sel.length >= MAX} onChange={() => toggle(p.id)} />
              Compare
            </label>
          } />
        ))}
      </div>

      {sel.length > 0 && (
        <div role="region" aria-label="Equipment comparison" className="fixed inset-x-0 bottom-0 z-40 border-t border-steel-200 bg-white/95 shadow-lift backdrop-blur">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="text-sm font-semibold">{sel.length} selected <span className="font-normal text-steel-500">(max {MAX})</span></p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSel([])}>Clear</Button>
              <Button size="sm" disabled={sel.length < 2} onClick={() => setOpen(true)}><GitCompareArrows /> Compare {sel.length < 2 && "(select 2+)"}</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-navy-950/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-3 top-[5vh] z-[81] max-h-[90vh] overflow-auto rounded-xl bg-white p-5 shadow-lift sm:inset-x-[5vw] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><Dialog.Title className="text-xl font-bold">Compare equipment</Dialog.Title><Dialog.Description className="text-sm text-steel-600">Values marked “awaiting confirmation” have not yet been verified by the manufacturer.</Dialog.Description></div>
              <Dialog.Close aria-label="Close" className="rounded p-2 hover:bg-steel-100"><X className="size-5" /></Dialog.Close>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead><tr><th scope="col" className="w-44 p-3" />{chosen.map((p) => (
                  <th key={p.id} scope="col" className="border-l border-steel-200 p-3 align-top"><Link href={`/equipment/${p.slug}`} className="font-bold text-navy-900 hover:text-[#00447B]">{p.name}</Link><p className="mt-1 text-xs font-normal text-steel-500">{p.category_name}</p></th>))}</tr></thead>
                <tbody>
                  <tr className="border-t border-steel-200"><th scope="row" className="p-3 font-semibold text-steel-600">Manufacturer</th>{chosen.map((p) => <td key={p.id} className="border-l border-steel-200 p-3">{p.manufacturer_name ?? "—"}</td>)}</tr>
                  {labels.map((l) => (
                    <tr key={l} className="border-t border-steel-200"><th scope="row" className="p-3 font-semibold text-steel-600">{l}</th>
                      {chosen.map((p) => { const s = p.specs.find((x) => x.label === l); return (
                        <td key={p.id} className="border-l border-steel-200 p-3">{s?.value ? `${s.value}${s.unit ? ` ${s.unit}` : ""}` : "—"}{s && s.verification !== "verified" && <span className="mt-0.5 block text-[11px] font-medium text-amber-700">Awaiting confirmation</span>}</td>); })}
                    </tr>
                  ))}
                  <tr className="border-t border-steel-200"><th scope="row" className="p-3" />{chosen.map((p) => <td key={p.id} className="border-l border-steel-200 p-3"><Button asChild size="sm"><Link href={`/rfq?product=${p.slug}`}>Request a Quote</Link></Button></td>)}</tr>
                </tbody>
              </table>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

