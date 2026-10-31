import "server-only";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/utils";
import { SITE } from "@/lib/site";

const from = () => process.env.EMAIL_FROM ?? "Proselect <no-reply@proselectimports.com>";
const salesInbox = () =>
  (process.env.SALES_NOTIFY_EMAIL ?? SITE.email).split(",").map((s) => s.trim()).filter(Boolean);

interface Mail { to: string | string[]; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] }

/** Sends via Resend. Without RESEND_API_KEY it logs (dev) and returns { sent:false } — never throws into a user flow. */
export async function sendMail(m: Mail): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email:not-configured] would send "${m.subject}" to ${[m.to].flat().join(", ")}`);
    return { sent: false };
  }
  try {
    const { error } = await new Resend(key).emails.send({
      from: from(), to: m.to, subject: m.subject, html: m.html, replyTo: m.replyTo, attachments: m.attachments,
    });
    if (error) throw new Error(error.message);
    return { sent: true };
  } catch (e) {
    console.error("email failed", m.subject, e);
    return { sent: false };
  }
}

/** Brand-aligned HTML email template per Page 18 of Proselect Brand Guidelines */
const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#E8EDF2;font-family:Inter,Arial,Helvetica,sans-serif;color:#2A2F36;line-height:1.6">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #C4CCD4">
<tr><td style="background:#00447B;height:60px;padding:0 28px;text-align:center;color:#ffffff;font-weight:900;letter-spacing:3px;font-size:20px;vertical-align:middle">
PROSELECT
</td></tr>
<tr><td style="height:3px;background:#C9A227"></td></tr>
<tr><td style="padding:32px 28px"><h2 style="margin:0 0 16px;color:#00447B;font-size:20px;font-weight:700">${escapeHtml(title)}</h2>${body}</td></tr>
<tr><td style="padding:18px 28px;background:#E8EDF2;font-size:12px;color:#6B7682;border-top:1px solid #C4CCD4">
<strong>${escapeHtml(SITE.name)}</strong> · ${escapeHtml(SITE.location)} · <a href="mailto:${escapeHtml(SITE.email)}" style="color:#00447B">${escapeHtml(SITE.email)}</a>
</td></tr>
</table></td></tr></table></body></html>`;

const row = (k: string, v: unknown) =>
  `<tr><td style="padding:6px 14px 6px 0;color:#6B7682;font-size:13px;vertical-align:top;font-weight:600">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;color:#2A2F36">${escapeHtml(v) || "—"}</td></tr>`;

export function rfqClientAck(p: { reference: string; contact: string; items: string[] }) {
  return shell("Request for Quotation Logged", `
  <p>Dear ${escapeHtml(p.contact)},</p>
  <p>Your request has been logged under reference <strong>${escapeHtml(p.reference)}</strong>.</p>
  <p><strong>Requested items:</strong></p>
  <ul>${p.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  <p>Our procurement team is reviewing the technical requirements and will provide formal commercial terms.</p>
  <p style="font-size:12px;color:#6B7682;margin-top:24px">This acknowledgement confirms receipt of an inquiry only. It is not a quotation, order confirmation or binding commercial commitment.</p>`);
}

export function rfqSalesAlert(p: { reference: string; company: string; contact: string; email: string; phone: string; category?: string | null; location?: string | null; items: string[]; url: string }) {
  return shell(`New RFQ ${p.reference}`, `
  <table>${row("Company", p.company)}${row("Contact", p.contact)}${row("Email", p.email)}${row("Phone", p.phone)}${row("Category", p.category)}${row("Location", p.location)}</table>
  <p style="margin-top:16px"><strong>Items</strong></p><ul>${p.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  <p style="margin-top:24px"><a href="${escapeHtml(p.url)}" style="background:#00447B;color:#ffffff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block">Open in Admin Command Centre</a></p>`);
}

export function genericAlert(title: string, rows: [string, unknown][], url?: string) {
  return shell(title, `<table>${rows.map(([k, v]) => row(k, v)).join("")}</table>${url ? `<p style="margin-top:20px"><a href="${escapeHtml(url)}" style="background:#00447B;color:#ffffff;padding:9px 18px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block">Open in Admin</a></p>` : ""}`);
}

export function genericAck(title: string, name: string, paragraphs: string[]) {
  return shell(title, `<p>Dear ${escapeHtml(name)},</p>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}`);
}

export const notifySales = (subject: string, html: string, replyTo?: string) =>
  sendMail({ to: salesInbox(), subject, html, replyTo });
