import type { Metadata } from "next";
import { ForgotForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">Reset your password</h1>
      <p className="mt-2 text-sm text-steel-600">We will email you a secure link.</p>
      <div className="mt-8"><ForgotForm /></div>
    </>
  );
}

