import { ClipboardList, FileText, FolderLock, LayoutDashboard, Bell, Truck, UserCog } from "lucide-react";
import { DashShell } from "@/components/dashboard/dash-shell";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: { default: "Client Portal", template: "%s | ProSelect Portal" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const s = await requireClient();
  const sb = await createClient();
  const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", s.id).is("read_at", null);
  const items = [
    { href: "/portal", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/portal/inquiries", label: "My Inquiries", icon: <ClipboardList /> },
    { href: "/portal/quotations", label: "My Quotations", icon: <FileText /> },
    { href: "/portal/orders", label: "Order Tracking", icon: <Truck /> },
    { href: "/portal/documents", label: "Document Centre", icon: <FolderLock /> },
    { href: "/portal/notifications", label: "Notifications", icon: <Bell />, badge: count ?? 0 },
    { href: "/portal/account", label: "Account", icon: <UserCog /> },
  ];
  return <DashShell items={items} title="Client Portal" tag="Client Portal" user={{ name: s.full_name ?? s.email, sub: s.company ?? s.email }}>{children}</DashShell>;
}

