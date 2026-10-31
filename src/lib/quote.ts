export interface QItem { description: string; quantity: number; unit_price: number }
export interface QTotals { subtotal: number; logistics: number; other: number; taxable: number; tax: number; total: number }

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Single source of truth for quotation maths (admin builder, client view and PDF). Tax applies to goods + logistics + other charges. */
export function quoteTotals(items: QItem[], logistics: number, other: number, taxRate: number): QTotals {
  const subtotal = r2(items.reduce((s, i) => s + i.quantity * i.unit_price, 0));
  const taxable = r2(subtotal + logistics + other);
  const tax = r2((taxable * taxRate) / 100);
  return { subtotal, logistics: r2(logistics), other: r2(other), taxable, tax, total: r2(taxable + tax) };
}

