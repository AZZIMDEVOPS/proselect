"use client";
import * as React from "react";
import Link from "next/link";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Honeypot, aria } from "@/components/ui/field";
import { Turnstile, useElapsed } from "./turnstile";
import { LOGISTICS_OPTIONS, rfqSchema, type RfqFormInput, type RfqInput } from "@/lib/validation";
import { submitRfq } from "@/lib/actions/public";
import { RFQ_DISCLAIMER } from "@/lib/site";
import { DIVISION_LABEL, type Division } from "@/lib/types";

export interface RfqProduct { slug: string; name: string; model: string | null; division: Division; category: string }
const STEPS = ["Equipment", "Requirements", "Project", "Logistics", "Review"] as const;
const TIMELINES = ["Immediate (under 1 month)", "1–3 months", "3–6 months", "6–12 months", "Planning / budgeting stage"];
const ARRANGEMENTS = ["Delivered to site", "Delivered to port of entry (Mombasa)", "Ex-works / factory pickup arranged by client", "To be advised by ProSelect"];
const blankItem = (slug = ""): RfqFormInput["items"][number] => ({ productSlug: slug, custom: false, quantity: 1 });

const STEP_FIELDS: Record<number, (f: RfqFormInput) => FieldPath<RfqFormInput>[]> = {
  0: (f) => f.items.flatMap((_, i): FieldPath<RfqFormInput>[] => [`items.${i}.productSlug`, `items.${i}.description`, `items.${i}.quantity`]),
  1: (f) => f.items.flatMap((_, i): FieldPath<RfqFormInput>[] => [`items.${i}.specifications`, `items.${i}.power`]),
  2: () => ["company", "contact", "email", "phone", "location", "countyCountry", "application", "timeline"],
  3: () => ["destination", "arrangement"],
};

export function RfqWizard({ products, initialSlug, defaults }: { products: RfqProduct[]; initialSlug?: string; defaults?: { company?: string; contact?: string; email?: string; phone?: string } }) {
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState("");
  const [hp, setHp] = React.useState("");
  const elapsed = useElapsed();
  const topRef = React.useRef<HTMLDivElement>(null);

  const validSlug = initialSlug && products.some((p) => p.slug === initialSlug) ? initialSlug : "";
  const form = useForm<RfqFormInput, unknown, RfqInput>({
    resolver: zodResolver(rfqSchema), mode: "onTouched",
    defaultValues: {
      items: [blankItem(validSlug)], logisticsSupport: [], consent: undefined as unknown as true,
      company: defaults?.company ?? "", contact: defaults?.contact ?? "", email: defaults?.email ?? "", phone: defaults?.phone ?? "",
    },
  });
  const { register, control, watch, trigger, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const values = watch();

  const go = async (to: number) => {
    if (to > step) {
      const ok = await trigger(STEP_FIELDS[step]?.(form.getValues()) ?? []);
      if (!ok) { toast.error("Please complete the required fields."); return; }
    }
    setStep(to);
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    const res = await submitRfq({ ...v, hp, turnstile: token, elapsedMs: elapsed() });
    if (res.ok) { setDone(res.reference); toast.success(`RFQ ${res.reference} submitted`); window.scrollTo({ top: 0 }); return; }
    if (res.fieldErrors) Object.entries(res.fieldErrors).forEach(([k, m]) => setError(k as FieldPath<RfqFormInput>, { message: m }));
    setFormError(res.error); toast.error(res.error);
  });

  if (done)
    return (
      <div role="status" className="mx-auto max-w-2xl rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-card sm:p-12">
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" aria-hidden />
        <h2 className="mt-5 text-2xl font-bold">Request submitted</h2>
        <p className="mt-3 text-steel-600">Your RFQ reference</p>
        <p className="mt-1 select-all text-3xl font-extrabold tracking-wide text-[#00447B]">{done}</p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-steel-600">
          A confirmation has been emailed to <strong>{values.email}</strong> and our sales team has been notified. We will review your technical requirements and contact you with next steps.
        </p>
        <p className="mx-auto mt-4 max-w-md rounded-md bg-steel-50 p-3 text-xs text-steel-600">{RFQ_DISCLAIMER}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><Link href="/portal">Track in Client Portal</Link></Button>
          <Button asChild variant="outline"><Link href="/equipment">Continue browsing</Link></Button>
        </div>
      </div>
    );

  const itemErr = (i: number, k: string) => (errors.items?.[i] as Record<string, { message?: string }> | undefined)?.[k]?.message;
  const productLabel = (slug?: string) => products.find((p) => p.slug === slug)?.name;
  const grouped = (Object.keys(DIVISION_LABEL) as Division[]).map((d) => ({ d, items: products.filter((p) => p.division === d) }));
  const pct = (step / (STEPS.length - 1)) * 100;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        if (step < 4) { e.preventDefault(); void go(step + 1); return; }   // Enter key advances, never submits early
        return submit(e);
      }}
    >
      <Honeypot value={hp} onChange={(e) => setHp(e.target.value)} />
      <div ref={topRef} className="scroll-mt-24" />

      {/* Animated progress */}
      <nav aria-label="RFQ progress" className="mb-10">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[19px] h-0.5 bg-steel-200" aria-hidden />
          <motion.div className="absolute left-0 top-[19px] h-0.5 bg-[#00447B]" aria-hidden initial={false} animate={{ width: `${pct}%` }} transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }} />
          <ol className="relative flex justify-between">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-col items-center gap-2" aria-current={i === step ? "step" : undefined}>
                <button type="button" onClick={() => i < step && go(i)} disabled={i > step} aria-label={`Step ${i + 1}: ${s}${i < step ? " (completed)" : ""}`}
                  className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${i < step ? "border-[#00447B] bg-[#00447B] text-white" : i === step ? "border-[#00447B] bg-white text-[#00447B]" : "border-steel-300 bg-white text-steel-400"}`}>
                  {i < step ? <Check className="size-4" /> : i + 1}
                </button>
                <span className={`hidden text-xs font-semibold sm:block ${i <= step ? "text-navy-900" : "text-steel-400"}`}>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-navy-900 sm:hidden">Step {step + 1} of 5 — {STEPS[step]}</p>
      </nav>

      <motion.div key={step} initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
        {step === 0 && (
          <section aria-labelledby="s1" className="space-y-6">
            <div><h2 id="s1" className="text-2xl font-bold">Select equipment</h2><p className="mt-1 text-sm text-steel-600">Choose from the catalogue or describe a custom requirement. Add as many items as you need.</p></div>
            {fields.map((f, i) => {
              const custom = values.items?.[i]?.custom;
              return (
                <fieldset key={f.id} className="rounded-xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
                  <legend className="px-2 text-sm font-bold text-[#00447B]">Item {i + 1}</legend>
                  <div className="mb-4 inline-flex rounded-md bg-steel-100 p-1 text-sm font-semibold" role="radiogroup" aria-label={`Item ${i + 1} type`}>
                    {[["Catalogue equipment", false], ["Custom inquiry", true]].map(([l, c]) => (
                      <button key={String(l)} type="button" role="radio" aria-checked={custom === c} onClick={() => setValue(`items.${i}.custom`, c as boolean)}
                        className={`rounded px-4 py-2 transition ${custom === c ? "bg-white text-navy-900 shadow-sm" : "text-steel-600"}`}>{l}</button>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    {!custom ? (
                      <Field label="Equipment" htmlFor={`it-${i}-p`} required error={itemErr(i, "productSlug")} >
                        <select className="field" {...register(`items.${i}.productSlug`)} {...aria(`it-${i}-p`, itemErr(i, "productSlug"))}>
                          <option value="">Select from catalogue…</option>
                          {grouped.map((g) => g.items.length > 0 && (
                            <optgroup key={g.d} label={DIVISION_LABEL[g.d]}>{g.items.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</optgroup>
                          ))}
                        </select>
                      </Field>
                    ) : (
                      <div className="grid gap-4">
                        <Field label="Equipment category" htmlFor={`it-${i}-c`}>
                          <select className="field" {...register(`items.${i}.category`)} id={`it-${i}-c`}>
                            <option value="">Select category…</option>
                            {Object.entries(DIVISION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                        </Field>
                        <Field label="Describe the equipment you need" htmlFor={`it-${i}-d`} required error={itemErr(i, "description")}>
                          <textarea rows={3} className="field" {...register(`items.${i}.description`)} {...aria(`it-${i}-d`, itemErr(i, "description"))} />
                        </Field>
                      </div>
                    )}
                    <Field label="Quantity" htmlFor={`it-${i}-q`} required error={itemErr(i, "quantity")}>
                      <input type="number" min={1} inputMode="numeric" className="field" {...register(`items.${i}.quantity`, { valueAsNumber: true })} {...aria(`it-${i}-q`, itemErr(i, "quantity"))} />
                    </Field>
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="mt-4 text-red-700" onClick={() => remove(i)}><Trash2 /> Remove item</Button>
                  )}
                </fieldset>
              );
            })}
            {errors.items?.message && <p role="alert" className="err">{errors.items.message}</p>}
            {fields.length < 20 && <Button type="button" variant="outline" onClick={() => append(blankItem())}><Plus /> Add another item</Button>}
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="s2" className="space-y-6">
            <div><h2 id="s2" className="text-2xl font-bold">Technical requirements</h2><p className="mt-1 text-sm text-steel-600">Share as much detail as you can. Anything you are unsure of, our technical team will clarify with you.</p></div>
            {fields.map((f, i) => (
              <fieldset key={f.id} className="grid gap-4 rounded-xl border border-steel-200 bg-white p-5 shadow-card sm:grid-cols-2 sm:p-6">
                <legend className="px-2 text-sm font-bold text-[#00447B]">Item {i + 1}: {values.items?.[i]?.custom ? "Custom inquiry" : productLabel(values.items?.[i]?.productSlug) ?? "Equipment"} × {values.items?.[i]?.quantity}</legend>
                <Field label="Product / model" htmlFor={`t-${i}-m`}><input className="field" {...register(`items.${i}.model`)} id={`t-${i}-m`} /></Field>
                <Field label="Preferred manufacturer (if known)" htmlFor={`t-${i}-pm`}><input className="field" {...register(`items.${i}.preferredManufacturer`)} id={`t-${i}-pm`} /></Field>
                <Field label="Technical specifications" htmlFor={`t-${i}-s`} className="sm:col-span-2"><textarea rows={3} className="field" {...register(`items.${i}.specifications`)} id={`t-${i}-s`} /></Field>
                <Field label="Battery capacity / power requirements" htmlFor={`t-${i}-pw`} className="sm:col-span-2" hint="Where relevant, e.g. voltage, kWh, kW, duty cycle."><input className="field" {...register(`items.${i}.power`)} {...aria(`t-${i}-pw`, undefined, "x")} /></Field>
                <Field label="Accessories" htmlFor={`t-${i}-a`}><textarea rows={2} className="field" {...register(`items.${i}.accessories`)} id={`t-${i}-a`} /></Field>
                <Field label="Spare parts" htmlFor={`t-${i}-sp`}><textarea rows={2} className="field" {...register(`items.${i}.spareParts`)} id={`t-${i}-sp`} /></Field>
                <Field label="Maintenance requirements" htmlFor={`t-${i}-mt`}><textarea rows={2} className="field" {...register(`items.${i}.maintenance`)} id={`t-${i}-mt`} /></Field>
                <Field label="Custom configurations" htmlFor={`t-${i}-cc`}><textarea rows={2} className="field" {...register(`items.${i}.customConfiguration`)} id={`t-${i}-cc`} /></Field>
              </fieldset>
            ))}
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="s3" className="space-y-6">
            <div><h2 id="s3" className="text-2xl font-bold">Project information</h2></div>
            <div className="grid gap-4 rounded-xl border border-steel-200 bg-white p-5 shadow-card sm:grid-cols-2 sm:p-6">
              <Field label="Company name" htmlFor="p-company" required error={errors.company?.message}><input className="field" autoComplete="organization" {...register("company")} {...aria("p-company", errors.company?.message)} /></Field>
              <Field label="Contact person" htmlFor="p-contact" required error={errors.contact?.message}><input className="field" autoComplete="name" {...register("contact")} {...aria("p-contact", errors.contact?.message)} /></Field>
              <Field label="Business email" htmlFor="p-email" required error={errors.email?.message}><input type="email" className="field" autoComplete="email" {...register("email")} {...aria("p-email", errors.email?.message)} /></Field>
              <Field label="Telephone number" htmlFor="p-phone" required error={errors.phone?.message}><input type="tel" className="field" autoComplete="tel" {...register("phone")} {...aria("p-phone", errors.phone?.message)} /></Field>
              <Field label="Project location" htmlFor="p-loc" required error={errors.location?.message}><input className="field" {...register("location")} {...aria("p-loc", errors.location?.message)} /></Field>
              <Field label="County / country" htmlFor="p-cc" required error={errors.countyCountry?.message}><input className="field" {...register("countyCountry")} {...aria("p-cc", errors.countyCountry?.message)} /></Field>
              <Field label="Intended application" htmlFor="p-app" required error={errors.application?.message} className="sm:col-span-2"><textarea rows={3} className="field" {...register("application")} {...aria("p-app", errors.application?.message)} /></Field>
              <Field label="Expected procurement timeline" htmlFor="p-tl" required error={errors.timeline?.message} className="sm:col-span-2">
                <select className="field" defaultValue="" {...register("timeline")} {...aria("p-tl", errors.timeline?.message)}>
                  <option value="" disabled>Select…</option>{TIMELINES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Additional requirements" htmlFor="p-add" className="sm:col-span-2"><textarea rows={3} className="field" {...register("additional")} id="p-add" /></Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="s4" className="space-y-6">
            <div><h2 id="s4" className="text-2xl font-bold">Logistics &amp; delivery</h2></div>
            <div className="grid gap-4 rounded-xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
              <Field label="Delivery destination" htmlFor="l-dest" required error={errors.destination?.message}><input className="field" {...register("destination")} {...aria("l-dest", errors.destination?.message)} /></Field>
              <Field label="Preferred delivery arrangement" htmlFor="l-arr" required error={errors.arrangement?.message}>
                <select className="field" defaultValue="" {...register("arrangement")} {...aria("l-arr", errors.arrangement?.message)}>
                  <option value="" disabled>Select…</option>{ARRANGEMENTS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Site accessibility requirements" htmlFor="l-site" hint="Road access, gradients, offloading equipment, gate widths, etc."><textarea rows={3} className="field" {...register("siteAccess")} {...aria("l-site", undefined, "x")} /></Field>
              <fieldset>
                <legend className="label">Import / logistics support required</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {LOGISTICS_OPTIONS.map((o) => (
                    <label key={o} className="flex cursor-pointer items-center gap-2.5 rounded-md border border-steel-200 px-3 py-2.5 text-sm hover:border-[#00447B]">
                      <input type="checkbox" value={o} className="size-4 accent-[#00447B]" {...register("logisticsSupport")} />{o}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby="s5" className="space-y-6">
            <div><h2 id="s5" className="text-2xl font-bold">Review &amp; submit</h2><p className="mt-1 text-sm text-steel-600">Check your request. Use the Back button to edit any section.</p></div>
            <div className="divide-y divide-steel-200 rounded-xl border border-steel-200 bg-white shadow-card">
              <ReviewBlock title="Equipment" onEdit={() => setStep(0)}>
                <ul className="space-y-3">
                  {values.items?.map((it, i) => (
                    <li key={i} className="text-sm"><p className="font-semibold text-navy-900">{it.quantity} × {it.custom ? "Custom inquiry" : productLabel(it.productSlug) ?? "—"}</p>
                      {it.custom && <p className="text-steel-600">{it.description}</p>}
                      {[["Model", it.model], ["Preferred manufacturer", it.preferredManufacturer], ["Specifications", it.specifications], ["Power", it.power], ["Accessories", it.accessories], ["Spare parts", it.spareParts], ["Maintenance", it.maintenance], ["Custom configuration", it.customConfiguration]].filter(([, v]) => v).map(([k, v]) => <p key={k as string} className="text-steel-600"><span className="font-medium text-charcoal">{k}:</span> {v}</p>)}
                    </li>
                  ))}
                </ul>
              </ReviewBlock>
              <ReviewBlock title="Project" onEdit={() => setStep(2)}>
                <Dl rows={[["Company", values.company], ["Contact", values.contact], ["Email", values.email], ["Phone", values.phone], ["Location", `${values.location}, ${values.countyCountry}`], ["Application", values.application], ["Timeline", values.timeline], ["Additional", values.additional]]} />
              </ReviewBlock>
              <ReviewBlock title="Logistics" onEdit={() => setStep(3)}>
                <Dl rows={[["Destination", values.destination], ["Arrangement", values.arrangement], ["Site access", values.siteAccess], ["Support", values.logisticsSupport?.join(", ")]]} />
              </ReviewBlock>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-steel-200 bg-steel-50 p-4 text-sm">
              <input type="checkbox" className="mt-0.5 size-5 accent-[#00447B]" {...register("consent")} {...aria("r-consent", errors.consent?.message)} />
              <span>I understand that {RFQ_DISCLAIMER.charAt(0).toLowerCase() + RFQ_DISCLAIMER.slice(1)}</span>
            </label>
            {errors.consent && <p id="r-consent-err" role="alert" className="err">{errors.consent.message}</p>}
            <Turnstile onToken={setToken} />
            <FormError message={formError} />
          </section>
        )}
      </motion.div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-steel-200 pt-6">
        <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft /> Back</Button>
        {step < 4 ? (
          <Button key="next" type="button" size="lg" onClick={() => go(step + 1)}>Continue <ArrowRight /></Button>
        ) : (
          <Button key="submit" type="submit" size="lg" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />} Submit request</Button>
        )}
      </div>
    </form>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wider text-[#00447B]">{title}</h3><Button type="button" variant="link" size="sm" onClick={onEdit}>Edit</Button></div>
      {children}
    </div>
  );
}
function Dl({ rows }: { rows: [string, string | undefined][] }) {
  return <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[160px_1fr]">{rows.filter(([, v]) => v).map(([k, v]) => <React.Fragment key={k}><dt className="text-steel-500">{k}</dt><dd className="font-medium">{v}</dd></React.Fragment>)}</dl>;
}
