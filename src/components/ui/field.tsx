import { cn } from "@/lib/utils";

export function Field({
  label, htmlFor, error, hint, required, className, children,
}: { label: string; htmlFor: string; error?: string; hint?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span aria-hidden className="ml-0.5 text-[#B91C1C]">*</span>}
      </label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="hint">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} role="alert" className="err">{error}</p>}
    </div>
  );
}

/** Props to spread on inputs so errors/hints are announced by screen readers. */
export const aria = (id: string, error?: string, hint?: string) => ({
  id, "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined,
});

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div role="alert" className={cn("rounded-md border border-[#FCA5A5] bg-[#FEE2E2] px-4 py-3 text-sm font-medium text-[#B91C1C]")}>{message}</div>;
}

/** Hidden honeypot — real users never see or fill it. */
export function Honeypot(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>Website (leave blank)<input type="text" tabIndex={-1} autoComplete="off" {...props} /></label>
    </div>
  );
}
