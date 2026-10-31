import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Verify access via RLS-enforced user client first (`is_staff() or (visible_to_client and client_id = my_client_id())`).
  const sb = await createClient();
  const { data: doc } = await sb
    .from("documents")
    .select("id,title,storage_path,mime_type,client_id")
    .eq("id", id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Stream bytes server-side so no storage URL is ever exposed in browser history.
  const admin = createAdminClient();
  const { data: blob, error } = await admin.storage.from("documents").download(doc.storage_path);
  if (error || !blob) return NextResponse.json({ error: "File unavailable" }, { status: 404 });

  await audit({ id: session.id, email: session.email }, "document.downloaded", "document", doc.id, { title: doc.title });

  const ext = doc.storage_path.split(".").pop() || "bin";
  const safeName = `${doc.title.replace(/[^\w.\- ]/g, "_").slice(0, 90)}.${ext}`;
  const bytes = new Uint8Array(await blob.arrayBuffer());

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": doc.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

