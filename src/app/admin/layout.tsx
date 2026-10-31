import {
  Building2,
  ClipboardList,
  Factory,
  FileCheck2,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageSquareMore,
  Package,
  Settings,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { DashShell } from "@/components/dashboard/dash-shell";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: { default: "Admin Command Centre", template: "%s | ProSelect Admin" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStaff();
  let newRfqs = 0, newApps = 0, newLeads = 0;

  if (isServiceRoleConfigured()) {
    const db = createAdminClient();
    const [r, a, l] = await Promise.all([
      db.from("rfqs").select("id", { count: "exact", head: true }).eq("status", "received"),
      db.from("manufacturer_applications").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    newRfqs = r.count ?? 0;
    newApps = a.count ?? 0;
    newLeads = l.count ?? 0;
  }

  const items = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard /> },
    { href: "/admin/rfqs", label: "RFQ Management", icon: <ClipboardList />, badge: newRfqs },
    { href: "/admin/quotations", label: "Quotations", icon: <FileText /> },
    { href: "/admin/orders", label: "Orders & Shipments", icon: <Truck /> },
    { href: "/admin/catalogue", label: "Sourcing Catalogue", icon: <Package /> },
    { href: "/admin/clients", label: "Clients", icon: <Building2 /> },
    { href: "/admin/manufacturers", label: "Manufacturers", icon: <Factory /> },
    { href: "/admin/applications", label: "Partner Applications", icon: <Handshake />, badge: newApps },
    { href: "/admin/leads", label: "Contact Leads", icon: <MessageSquareMore />, badge: newLeads },
    { href: "/admin/settings", label: "CMS & Settings", icon: <Settings /> },
    { href: "/admin/audit", label: "Team & Audit Logs", icon: <ShieldAlert /> },
  ];

  const roleLabel = s.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <DashShell
      items={items}
      title="Admin Command Centre"
      tag={`Command Centre · ${roleLabel}`}
      user={{ name: s.full_name ?? s.email, sub: `${roleLabel} · ${s.email}` }}
    >
      {children}
    </DashShell>
  );
}

