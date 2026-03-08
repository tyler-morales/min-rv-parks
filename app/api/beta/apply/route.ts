import { createAdminClient } from "@/lib/supabase/admin";
import { sendBetaApplied } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, notes } = body as {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };

  if (!name || !email || !phone) {
    return NextResponse.json(
      { error: "name, email, and phone are required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("beta_applications")
    .insert({ name, email: email.toLowerCase().trim(), phone, notes: notes ?? "" })
    .select("id, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An application with this email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendBetaApplied({ adminEmail, name, email, phone, notes: notes ?? "" }).catch(
      console.error,
    );
  }

  return NextResponse.json({ id: data.id, status: data.status });
}
