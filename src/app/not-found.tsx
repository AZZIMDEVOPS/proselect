import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-svh flex-col items-center justify-center bg-[#002545] px-6 text-center text-white">
      <Logo dark />
      <p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-[#C9A227]">Error 404</p>
      <h1 className="mt-3 text-4xl font-extrabold !text-white sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#C4CCD4]">
        The page or equipment listing you requested may have been moved or unpublished.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" variant="accent"><Link href="/">Return Home <ArrowRight /></Link></Button>
        <Button asChild size="lg" variant="outline-light"><Link href="/equipment">Browse Equipment Catalogue</Link></Button>
      </div>
    </main>
  );
}
