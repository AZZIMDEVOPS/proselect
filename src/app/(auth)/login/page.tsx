import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/auth-forms";
import { SetupNotice } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; setup?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Client &amp; staff sign in</h1>
      <p className="mt-2 text-sm text-steel-600">Access the ProSelect portal.</p>
      {!isSupabaseConfigured() && <div className="mt-6"><SetupNotice what="Sign-in" /></div>}
      {sp.error === "link" && <p role="alert" className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-800">That confirmation link is invalid or has expired. Please sign in or request a new one.</p>}
      <div className="mt-8"><LoginForm next={sp.next} /></div>
    </>
  );
}

