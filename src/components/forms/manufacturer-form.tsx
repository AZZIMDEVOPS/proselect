"use client";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Honeypot, aria } from "@/components/ui/field";
import { Turnstile, useElapsed } from "./turnstile";
import { manufacturerSchema, type ManufacturerInput } from "@/lib/validation";
import { submitManufacturerApplication } from "@/lib/actions/public";

const ARRANGEMENTS = ["Exclusive representation (Kenya)", "Exclusive representation (East Africa)", "Non-exclusive representation", "Distribution / dealer partnership", "Open to discussion"];

export function ManufacturerForm({ categories }: { categories: { division: string; items: string[] }[] }) {
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ManufacturerInput>({
    resolver: zodResolver(manufacturerSchema), defaultValues: { categories: [] },
  });
  const [files, setFiles] = React.useState<File[]>([]);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState("");
  const [hp, setHp] = React.useState("");
  const elapsed = useElapsed();

  if (done)
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h3 className="mt-4 text-xl font-bold">Application submitted</h3>
        <p className="mt-2 text-sm text-steel-600">Reference <strong className="text-navy-900">{done}</strong>. Your application has entered our approval workflow. Submitting an application does not grant access to any client or commercial information.</p>
      </div>
    );

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    const bad = arr.find((f) => !["application/pdf", "image/jpeg", "image/png"].includes(f.type) || f.size > 10 * 1024 * 1024);
    if (arr.length > 5) setFileError("Attach at most 5 files.");
    else if (bad) setFileError(`“${bad.name}” must be a PDF, JPG or PNG under 10 MB.`);
    else { setFileError(null); setFiles(arr); }
  };

  return (
    <form
      noValidate className="relative grid gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(async (v) => {
        if (fileError) return;
        setFormError(null);
        const fd = new FormData();
        fd.set("payload", JSON.stringify({ ...v, hp, turnstile: token, elapsedMs: elapsed() }));
        files.forEach((f) => fd.append("files", f));
        const res = await submitManufacturerApplication(fd);
        if (res.ok) { setDone(res.reference); toast.success("Application submitted"); return; }
        if (res.fieldErrors) Object.entries(res.fieldErrors).forEach(([k, m]) => setError(k as keyof ManufacturerInput, { message: m }));
        setFormError(res.error); toast.error(res.error);
      })}
    >
      <Honeypot value={hp} onChange={(e) => setHp(e.target.value)} />
      <Field label="Company name" htmlFor="m-company" required error={errors.company?.message}><input className="field" autoComplete="organization" {...register("company")} {...aria("m-company", errors.company?.message)} /></Field>
      <Field label="Country of manufacture" htmlFor="m-country" required error={errors.country?.message}><input className="field" {...register("country")} {...aria("m-country", errors.country?.message)} /></Field>
      <Field label="Company website" htmlFor="m-web" error={errors.website?.message}><input type="url" placeholder="https://" className="field" {...register("website")} {...aria("m-web", errors.website?.message)} /></Field>
      <Field label="Contact person" htmlFor="m-contact" required error={errors.contact?.message}><input className="field" autoComplete="name" {...register("contact")} {...aria("m-contact", errors.contact?.message)} /></Field>
      <Field label="Business email" htmlFor="m-email" required error={errors.email?.message}><input type="email" className="field" autoComplete="email" {...register("email")} {...aria("m-email", errors.email?.message)} /></Field>
      <Field label="Telephone / WhatsApp" htmlFor="m-phone" error={errors.phone?.message}><input type="tel" className="field" autoComplete="tel" {...register("phone")} {...aria("m-phone", errors.phone?.message)} /></Field>

      <fieldset className="sm:col-span-2" aria-describedby={errors.categories ? "m-cat-err" : undefined}>
        <legend className="label">Product categories <span className="text-[#00447B]" aria-hidden>*</span></legend>
        <Controller control={control} name="categories" render={({ field }) => (
          <div className="grid gap-5 rounded-lg border border-steel-200 bg-steel-50 p-4 sm:grid-cols-3">
            {categories.map((g) => (
              <div key={g.division}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-navy-700">{g.division}</p>
                {g.items.map((c) => (
                  <label key={c} className="flex cursor-pointer items-start gap-2 py-1 text-sm">
                    <input type="checkbox" className="mt-1 size-4 accent-[#00447B]" checked={field.value.includes(c)}
                      onChange={(e) => field.onChange(e.target.checked ? [...field.value, c] : field.value.filter((x) => x !== c))} />
                    {c}
                  </label>
                ))}
              </div>
            ))}
          </div>
        )} />
        {errors.categories && <p id="m-cat-err" role="alert" className="err">{errors.categories.message}</p>}
      </fieldset>

      <Field label="Products & capabilities" htmlFor="m-products" required error={errors.products?.message} className="sm:col-span-2" hint="Describe product ranges, production capacity and export experience.">
        <textarea rows={4} className="field" {...register("products")} {...aria("m-products", errors.products?.message, "x")} />
      </Field>
      <Field label="Certifications" htmlFor="m-cert" error={errors.certifications?.message} className="sm:col-span-2" hint="List only certifications you currently hold. Supporting documents may be attached below and will be verified.">
        <textarea rows={3} className="field" {...register("certifications")} {...aria("m-cert", errors.certifications?.message, "x")} />
      </Field>
      <Field label="Desired representation arrangement" htmlFor="m-arr" required error={errors.arrangement?.message} className="sm:col-span-2">
        <select className="field" defaultValue="" {...register("arrangement")} {...aria("m-arr", errors.arrangement?.message)}>
          <option value="" disabled>Select…</option>
          {ARRANGEMENTS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <label htmlFor="m-files" className="label">Product catalogues, brochures &amp; certificates</label>
        <label htmlFor="m-files" className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-steel-400 bg-steel-50 px-4 py-4 text-sm text-steel-600 hover:border-[#00447B]">
          <Paperclip className="size-5 text-[#00447B]" aria-hidden />
          {files.length ? files.map((f) => f.name).join(", ") : "Choose files (PDF, JPG, PNG · max 5 files · 10 MB each)"}
        </label>
        <input id="m-files" type="file" multiple accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        {fileError && <p role="alert" className="err">{fileError}</p>}
      </div>

      <Field label="Additional message" htmlFor="m-msg" error={errors.message?.message} className="sm:col-span-2"><textarea rows={3} className="field" {...register("message")} {...aria("m-msg", errors.message?.message)} /></Field>
      <div className="sm:col-span-2"><Turnstile onToken={setToken} /></div>
      <div className="grid gap-4 sm:col-span-2">
        <FormError message={formError} />
        <Button type="submit" size="lg" disabled={isSubmitting} className="justify-self-start">{isSubmitting && <Loader2 className="animate-spin" />} Submit application</Button>
      </div>
    </form>
  );
}

