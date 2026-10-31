"use client";
import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Honeypot, aria } from "@/components/ui/field";
import { Turnstile } from "./turnstile";
import { requestPasswordReset, signIn, signUp, type AuthState } from "@/lib/actions/auth";

const Info = ({ s }: { s: AuthState }) => (s?.info ? <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{s.info}</div> : null);

export function LoginForm({ next }: { next?: string }) {
  const [s, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="l-email" required><input id="l-email" name="email" type="email" autoComplete="email" required className="field" /></Field>
      <Field label="Password" htmlFor="l-pw" required><input id="l-pw" name="password" type="password" autoComplete="current-password" required className="field" /></Field>
      <FormError message={s?.error} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Sign in</Button>
      <div className="flex justify-between text-sm"><Link href="/forgot-password" className="text-[#00447B] hover:underline">Forgot password?</Link><Link href="/register" className="font-semibold text-[#00447B] hover:underline">Create account</Link></div>
    </form>
  );
}

export function RegisterForm() {
  const [s, action, pending] = useActionState(signUp, undefined);
  const [token, setToken] = React.useState("");
  const [t0, setT0] = React.useState(0);
  React.useEffect(() => setT0(Date.now()), []);
  const e = s?.fieldErrors ?? {};
  return (
    <form action={(fd) => { fd.set("elapsedMs", String(Date.now() - t0)); fd.set("turnstile", token); return action(fd); }} className="space-y-5">
      <Honeypot name="hp" />
      <Field label="Full name" htmlFor="r-name" required error={e.fullName}><input name="fullName" autoComplete="name" required className="field" {...aria("r-name", e.fullName)} /></Field>
      <Field label="Company" htmlFor="r-co" required error={e.company}><input name="company" autoComplete="organization" required className="field" {...aria("r-co", e.company)} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business email" htmlFor="r-em" required error={e.email}><input name="email" type="email" autoComplete="email" required className="field" {...aria("r-em", e.email)} /></Field>
        <Field label="Telephone" htmlFor="r-ph" required error={e.phone}><input name="phone" type="tel" autoComplete="tel" required className="field" {...aria("r-ph", e.phone)} /></Field>
      </div>
      <Field label="Password" htmlFor="r-pw" required error={e.password} hint="At least 10 characters with upper, lower case and a number."><input name="password" type="password" autoComplete="new-password" required minLength={10} className="field" {...aria("r-pw", e.password, "x")} /></Field>
      <Turnstile onToken={setToken} />
      <FormError message={s?.error} /><Info s={s} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Create client account</Button>
      <p className="text-center text-sm">Already registered? <Link href="/login" className="font-semibold text-[#00447B] hover:underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [s, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="Email" htmlFor="f-email" required><input id="f-email" name="email" type="email" autoComplete="email" required className="field" /></Field>
      <FormError message={s?.error} /><Info s={s} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Send reset link</Button>
      <p className="text-center text-sm"><Link href="/login" className="font-semibold text-[#00447B] hover:underline">Back to sign in</Link></p>
    </form>
  );
}

