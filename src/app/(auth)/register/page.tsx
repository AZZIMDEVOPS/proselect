import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/auth-forms";
import { SetupNotice } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create client account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">Create your client account</h1>
      <p className="mt-2 text-sm text-steel-600">Track RFQs, review quotations and access documents in one secure place.</p>
      {!isSupabaseConfigured() && <div className="mt-6"><SetupNotice what="Registration" /></div>}
      <div className="mt-8"><RegisterForm /></div>
    </>
  );
}

