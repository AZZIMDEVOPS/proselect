import { cn } from "@/lib/utils";

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border border-steel-200 bg-white shadow-card", className)} {...p} />
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("animate-pulse rounded-md bg-steel-200/70", className)} />
);

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-steel-300 bg-steel-50 px-6 py-14 text-center">
      <p className="text-base font-semibold text-navy-900">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-steel-600">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function SetupNotice({ what = "This area" }: { what?: string }) {
  return (
    <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">{what} needs the Supabase backend.</p>
      <p className="mt-1">
        Add <code className="rounded bg-white/70 px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="rounded bg-white/70 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
        <code className="rounded bg-white/70 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>, run the migrations in <code>supabase/migrations</code>, then restart. See README.md.
      </p>
    </div>
  );
}

