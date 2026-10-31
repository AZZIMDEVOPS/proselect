"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DM from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { NAV, SOLUTIONS } from "@/lib/site";
import { cn } from "@/lib/utils";

const DROPDOWN: Record<string, { href: string; label: string }[]> = {
  "/solutions": SOLUTIONS.map((s) => ({ href: `/solutions#${s.slug}`, label: s.title })),
  "/equipment": SOLUTIONS.map((s) => ({ href: `/equipment?division=${s.division}`, label: s.title.split(" & ")[0] })),
};

export function SiteHeader() {
  const path = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  React.useEffect(() => setOpen(false), [path]);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const link = "relative px-2.5 py-2 text-[14px] font-semibold tracking-wide text-[#00447B] transition-colors hover:text-[#002545] hover:underline";

  return (
    <header className={cn("sticky top-0 z-50 border-b transition-all duration-300", scrolled ? "border-[#C4CCD4] bg-white/95 shadow-xs backdrop-blur-md" : "border-transparent bg-white")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>
      <div className="container-x flex h-[76px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) =>
            DROPDOWN[n.href] ? (
              <DM.Root key={n.href}>
                <DM.Trigger className={cn(link, "flex items-center gap-1 data-[state=open]:text-[#002545] data-[state=open]:underline", active(n.href) && "text-[#002545] underline")}>
                  {n.label}<ChevronDown className="size-3.5" aria-hidden />
                </DM.Trigger>
                <DM.Portal>
                  <DM.Content sideOffset={10} align="start" className="z-[70] min-w-72 rounded-lg border border-[#C4CCD4] bg-white p-2 shadow-lift data-[state=open]:animate-in">
                    <DM.Item asChild>
                      <Link href={n.href} className="block rounded-md px-3 py-2.5 text-sm font-semibold text-[#00447B] outline-none data-[highlighted]:bg-[#E8EDF2] data-[highlighted]:text-[#002545]">All {n.label.toLowerCase()}</Link>
                    </DM.Item>
                    <DM.Separator className="my-1 h-px bg-[#C4CCD4]" />
                    {DROPDOWN[n.href].map((d) => (
                      <DM.Item key={d.href} asChild>
                        <Link href={d.href} className="block rounded-md px-3 py-2.5 text-sm text-[#2A2F36] outline-none data-[highlighted]:bg-[#E8EDF2] data-[highlighted]:text-[#00447B]">{d.label}</Link>
                      </DM.Item>
                    ))}
                  </DM.Content>
                </DM.Portal>
              </DM.Root>
            ) : (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn(link, active(n.href) && "text-[#002545] underline")}>
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="hidden items-center gap-2.5 xl:flex">
          <Button asChild variant="ghost" size="sm"><Link href="/portal"><UserRound /> Client Portal</Link></Button>
          <Button asChild variant="accent" size="sm"><Link href="/rfq">Request a Quote</Link></Button>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu"><Menu className="size-6 text-[#00447B]" /></Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#002545]/70 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-[91] flex w-[88vw] max-w-sm flex-col bg-[#002545] p-6 text-white shadow-lift">
              <Dialog.Title className="sr-only">Site navigation</Dialog.Title>
              <Dialog.Description className="sr-only">Main navigation links</Dialog.Description>
              <div className="flex items-center justify-between">
                <Logo dark />
                <Dialog.Close aria-label="Close menu" className="rounded p-2 text-white hover:bg-white/10"><X className="size-5" /></Dialog.Close>
              </div>
              <nav aria-label="Mobile" className="mt-8 flex-1 space-y-1 overflow-y-auto">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
                    className={cn("block rounded-md px-3 py-3 text-base font-semibold text-white/90 hover:bg-white/10", active(n.href) && "bg-white/15 text-white underline")}>
                    {n.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 grid gap-3">
                <Button asChild variant="outline-light" size="lg"><Link href="/portal"><UserRound /> Client Portal</Link></Button>
                <Button asChild variant="accent" size="lg"><Link href="/rfq">Request a Quote</Link></Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
