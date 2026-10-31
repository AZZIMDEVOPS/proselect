import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

export const formatDate = (d?: string | Date | null, withTime = false) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}), timeZone: "Africa/Nairobi",
  }).format(new Date(d));
};

export const formatMoney = (n: number | string | null | undefined, currency = "USD") =>
  n == null ? "—" : new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(Number(n));

/** Escape a value for use inside an HTML email. */
export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Strip control characters and trim — used on all free-text input before persisting. */
export const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

