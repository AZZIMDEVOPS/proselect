import Link from "next/link";
import { Mail, MapPin, Globe, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Logo } from "./logo";
import { NAV, SITE, SOLUTIONS, TRUST_PILLARS } from "@/lib/site";

export function SiteFooter({ settings }: { settings: Record<string, unknown> }) {
  const phone = String(settings["contact.phone"] ?? "");
  const linkedin = String(settings["social.linkedin"] ?? "");
  const regNumber = String(settings["company.registration_number"] ?? "");
  const kraPin = String(settings["company.kra_pin"] ?? "");
  const vatNumber = String(settings["company.vat_number"] ?? "");
  const physicalAddress = String(settings["contact.physical_address"] ?? SITE.location);
  const namedContact = String(settings["contact.named_contact"] ?? "Commercial & Procurement Desk");

  return (
    <footer className="bg-[#002545] text-[#C4CCD4]">
      {/* 3 Trust Pillars Bar */}
      <div className="border-b border-white/10 bg-[#001D36] py-8">
        <div className="container-x grid gap-6 sm:grid-cols-3">
          {TRUST_PILLARS.map((p) => (
            <div key={p.name} className="flex gap-3">
              <CheckCircle2 className="size-5 shrink-0 text-[#C9A227]" aria-hidden />
              <div>
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#C4CCD4]">{p.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo dark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#C4CCD4]">
            Proselect Fleet &amp; Industrial Solutions Limited sources, documents and delivers specialized fleet vehicles, renewable energy systems and heavy industrial machinery for East African operators.
          </p>
          <div className="mt-5 border-t border-white/10 pt-4 text-xs text-[#C4CCD4] space-y-1">
            <p className="font-semibold text-white">{SITE.name}</p>
            {regNumber && <p>BRS Reg: {regNumber}</p>}
            {kraPin && <p>KRA PIN: {kraPin}{vatNumber ? ` · VAT: ${vatNumber}` : ""}</p>}
            <p>Lead Contact: {namedContact}</p>
          </div>
        </div>

        <nav aria-label="Footer quick links" className="lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A227]">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((n) => <li key={n.href}><Link className="hover:text-white hover:underline" href={n.href}>{n.label}</Link></li>)}
            <li><Link className="hover:text-white hover:underline" href="/rfq">Request a Quote</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/portal">Client Portal</Link></li>
          </ul>
        </nav>

        <nav aria-label="Footer solutions" className="lg:col-span-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A227]">Specialist Divisions</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SOLUTIONS.map((s) => (
              <li key={s.slug}>
                <Link className="hover:text-white hover:underline" href={`/equipment?division=${s.division}`}>{s.title}</Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#C9A227]">Manufacturer partnerships</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/manufacturer-partnerships">Partner with Proselect</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/manufacturer-partnerships#apply">Manufacturer application</Link></li>
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A227]">Contact &amp; Operations</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-[#C9A227]" aria-hidden />{physicalAddress}</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-[#C9A227]" aria-hidden /><a className="hover:text-white hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            {phone && <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-[#C9A227]" aria-hidden /><a className="hover:text-white hover:underline" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>}
            <li className="flex gap-2.5"><Globe className="mt-0.5 size-4 shrink-0 text-[#C9A227]" aria-hidden /><a className="hover:text-white hover:underline" href={`https://${SITE.domain}`}>{SITE.domain}</a></li>
            {linkedin && <li><a className="font-semibold text-white hover:underline" href={linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a></li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#001D36]">
        <div className="container-x flex flex-col gap-3 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link className="hover:text-white hover:underline" href="/privacy">Privacy Policy</Link>
            <Link className="hover:text-white hover:underline" href="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
