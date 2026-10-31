"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export interface NavItem { href: string; label: string; icon: React.ReactNode; badge?: number }

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const isActive = (h: string) => (h === "/portal" || h === "/admin" ? path === h : path.startsWith(h));
  return (
    <nav aria-label="Dashboard" className="space-y-1">
      {items.map((i) => (
        <Link key={i.href} href={i.href} onClick={onNavigate} aria-current={isActive(i.href) ? "page" : undefined}
          className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors [&_svg]:size-[18px]", isActive(i.href) ? "bg-white/12 text-white" : "text-steel-300 hover:bg-white/8 hover:text-white")}>
          {i.icon}<span className="flex-1">{i.label}</span>
          {!!i.badge && <span className="rounded-full bg-[#00447B] px-2 py-0.5 text-[11px] font-bold text-white">{i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function DashShell({ items, title, user, children, tag }: {
  items: NavItem[]; title: string; user: { name: string; sub: string }; children: React.ReactNode; tag?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const side = (onNav?: () => void) => (
    <div className="flex h-full flex-col bg-navy-900 p-5">
      <Logo dark href="/" />
      {tag && <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">{tag}</p>}
      <div className="mt-4 flex-1 overflow-y-auto"><NavList items={items} onNavigate={onNav} /></div>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-steel-400">{user.sub}</p>
        <form action={signOut}><Button type="submit" variant="ghost" size="sm" className="mt-3 w-full justify-start !text-steel-300 hover:!bg-white/10 hover:!text-white"><LogOut /> Sign out</Button></form>
      </div>
    </div>
  );
  return (
    <div className="min-h-svh bg-steel-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-svh lg:block">{side()}</aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-steel-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="size-6" /></Button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[90] bg-navy-950/60" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-[91] w-[85vw] max-w-[300px]">
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title><Dialog.Description className="sr-only">Dashboard navigation</Dialog.Description>
                  {side(() => setOpen(false))}
                  <Dialog.Close aria-label="Close navigation" className="absolute right-3 top-4 rounded p-1 text-white hover:bg-white/10"><X className="size-5" /></Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <h1 className="text-base font-bold text-navy-900 sm:text-lg">{title}</h1>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/">View website</Link></Button>
        </header>
        <main id="main" className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

