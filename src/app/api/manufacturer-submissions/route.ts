import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { COMMERCIAL_ROLES } from "@/lib/types";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !COMMERCIAL_ROLES.includes(session.role) || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appId = request.nextUrl.searchParams.get("applicationId");
  const path = request.nextUrl.searchParams.get("path");
  if (!appId || !path) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("manufacturer_applications")
    .select("id,attachments")
    .eq("id", appId)
    .maybeSingle();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const attachments = (app.attachments ?? []) as { path: string; name: string; kind: string }[];
  const entry = attachments.find((a) => a.path === path);
  if (!entry) return NextResponse.json({ error: "Attachment not found on application" }, { status: 404 });

  const { data: blob, error } = await admin.storage.from("manufacturer-submissions").download(entry.path);
  if (error || !blob) return NextResponse.json({ error: "File unavailable" }, { status: 404 });

  await audit({ id: session.id, email: session.email }, "manufacturer_application.attachment_downloaded", "manufacturer_application", app.id, { name: entry.name });

  const safeName = entry.name.replace(/[^\w.\- ]/g, "_").slice(0, 100);
  return new NextResponse(new Uint8Array(await blob.arrayBuffer()), {
    status: 200,
    headers: {
      "Content-Type": entry.kind || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

