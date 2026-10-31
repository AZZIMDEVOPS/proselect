import Link from "next/link";
import { Check } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { ORDER_STAGES } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export const StatusBadge = ({ s }: { s: string }) => <Badge tone={statusTone(s)}>{label(s)}</Badge>;

export function PageHeading({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h2>{children && <p className="mt-1 text-sm text-steel-600">{children}</p>}</div>
      {actions}
    </div>
  );
}

export function StatCard({ title, value, hint, href, accent }: { title: string; value: React.ReactNode; hint?: string; href?: string; accent?: boolean }) {
  const inner = (
    <div className={cn("h-full rounded-xl border bg-white p-5 shadow-card transition", accent ? "border-[#C4CCD4]" : "border-steel-200", href && "hover:-translate-y-0.5 hover:shadow-lift")}>
      <p className="text-xs font-bold uppercase tracking-wider text-steel-500">{title}</p>
      <p className={cn("mt-2 text-3xl font-extrabold", accent ? "text-[#00447B]" : "text-navy-900")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-steel-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export function Panel({ title, children, actions, className }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-steel-200 bg-white shadow-card", className)}>
      {title && <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4"><h3 className="text-base font-bold text-navy-900">{title}</h3>{actions}</div>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[170px_1fr]">
      {rows.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
        <div key={k} className="contents"><dt className="text-steel-500">{k}</dt><dd className="font-medium text-charcoal break-words">{v}</dd></div>
      ))}
    </dl>
  );
}

/** Vertical timeline of all 12 stages. Completed = at/below current stage; milestones add dates & notes. */
export function OrderTimeline({ stage, milestones }: { stage: string; milestones: { stage: string; note: string | null; location: string | null; occurred_at: string }[] }) {
  const idx = ORDER_STAGES.findIndex(([k]) => k === stage);
  return (
    <ol className="relative space-y-0">
      {ORDER_STAGES.map(([k, l], i) => {
        const done = i < idx || (i === idx && stage === "completed");
        const current = i === idx && stage !== "completed";
        const ms = milestones.filter((m) => m.stage === k);
        return (
          <li key={k} className="relative flex gap-4 pb-7 last:pb-0" aria-current={current ? "step" : undefined}>
            {i < ORDER_STAGES.length - 1 && <span aria-hidden className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", i < idx ? "bg-[#00447B]" : "bg-steel-200")} />}
            <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
              done ? "border-[#00447B] bg-[#00447B] text-white" : current ? "border-[#00447B] bg-white text-[#00447B] ring-4 ring-[#B3C7DC]" : "border-steel-300 bg-white text-steel-400")}>
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-bold", done || current ? "text-navy-900" : "text-steel-400")}>{l}{current && <span className="ml-2 rounded bg-[#E8EDF2] px-2 py-0.5 text-[11px] font-bold text-[#00447B]">Current stage</span>}</p>
              {ms.map((m, n) => (
                <p key={n} className="mt-1 text-xs text-steel-600">{formatDate(m.occurred_at, true)}{m.location ? ` · ${m.location}` : ""}{m.note ? ` — ${m.note}` : ""}</p>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
