"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Honeypot, aria } from "@/components/ui/field";
import { Turnstile, useElapsed } from "./turnstile";
import { INQUIRY_CATEGORIES, contactSchema, type ContactInput } from "@/lib/validation";
import { submitContact } from "@/lib/actions/public";

export function ContactForm() {
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema), defaultValues: { category: undefined },
  });
  const [done, setDone] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState("");
  const [hp, setHp] = React.useState("");
  const elapsed = useElapsed();

  if (done)
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h3 className="mt-4 text-xl font-bold">Message received</h3>
        <p className="mt-2 text-sm text-steel-600">Your reference is <strong className="text-navy-900">{done}</strong>. A confirmation has been sent to your email.</p>
        <Button className="mt-6" variant="outline" onClick={() => { setDone(null); reset(); }}>Send another message</Button>
      </div>
    );

  return (
    <form
      noValidate className="relative grid gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(async (v) => {
        setFormError(null);
        const res = await submitContact({ ...v, hp, turnstile: token, elapsedMs: elapsed() });
        if (res.ok) { setDone(res.reference); toast.success("Message sent"); return; }
        if (res.fieldErrors) Object.entries(res.fieldErrors).forEach(([k, m]) => setError(k as keyof ContactInput, { message: m }));
        setFormError(res.error); toast.error(res.error);
      })}
    >
      <Honeypot value={hp} onChange={(e) => setHp(e.target.value)} />
      <Field label="Full name" htmlFor="c-name" required error={errors.name?.message}><input className="field" autoComplete="name" {...register("name")} {...aria("c-name", errors.name?.message)} /></Field>
      <Field label="Company" htmlFor="c-company" error={errors.company?.message}><input className="field" autoComplete="organization" {...register("company")} {...aria("c-company", errors.company?.message)} /></Field>
      <Field label="Business email" htmlFor="c-email" required error={errors.email?.message}><input type="email" className="field" autoComplete="email" {...register("email")} {...aria("c-email", errors.email?.message)} /></Field>
      <Field label="Telephone" htmlFor="c-phone" error={errors.phone?.message}><input type="tel" className="field" autoComplete="tel" {...register("phone")} {...aria("c-phone", errors.phone?.message)} /></Field>
      <Field label="Inquiry category" htmlFor="c-cat" required error={errors.category?.message} className="sm:col-span-2">
        <select className="field" defaultValue="" {...register("category")} {...aria("c-cat", errors.category?.message)}>
          <option value="" disabled>Select a category…</option>
          {INQUIRY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Message" htmlFor="c-msg" required error={errors.message?.message} className="sm:col-span-2"><textarea rows={6} className="field" {...register("message")} {...aria("c-msg", errors.message?.message)} /></Field>
      <div className="sm:col-span-2"><Turnstile onToken={setToken} /></div>
      <div className="grid gap-4 sm:col-span-2">
        <FormError message={formError} />
        <Button type="submit" size="lg" disabled={isSubmitting} className="justify-self-start">{isSubmitting && <Loader2 className="animate-spin" />} Send message</Button>
        <p className="text-xs text-steel-500">By submitting you agree to be contacted about your inquiry. See our Privacy Policy.</p>
      </div>
    </form>
  );
}

