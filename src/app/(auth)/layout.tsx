import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden isolate overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Image src="/images/cta.jpg" alt="" fill sizes="50vw" className="-z-20 object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/60 to-navy-950/90" />
        <Logo dark />
        <div><p className="text-3xl font-bold leading-snug !text-white">Global Manufacturing. Local Expertise. Smarter Procurement.</p>
          <p className="mt-4 max-w-md text-sm text-steel-300">Secure access to your RFQs, quotations, order tracking and documents.</p></div>
      </div>
      <main id="main" className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {children}
          <p className="mt-10 text-center text-xs text-steel-500"><Link href="/" className="hover:text-[#00447B] hover:underline">← Back to proselectimports.com</Link></p>
        </div>
      </main>
    </div>
  );
}

