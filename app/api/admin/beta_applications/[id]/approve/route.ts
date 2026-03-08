import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBetaApproved } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("beta_applications")
    .update({ status: "APPROVED" })
    .eq("id", id)
    .select("id, name, email, status")
    .single();

  if (error || !app) {
    return NextResponse.json(
      { error: error?.message ?? "Application not found" },
      { status: error ? 500 : 404 },
    );
  }

  const emailSent = await sendBetaApproved({
    guestEmail: app.email,
    guestName: app.name,
  }).catch(() => false);

  return NextResponse.json({ id: app.id, status: app.status, emailSent });
}
