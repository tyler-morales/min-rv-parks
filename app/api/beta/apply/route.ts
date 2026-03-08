import { createAdminClient } from "@/lib/supabase/admin";
import { sendBetaApplied } from "@/lib/email";
import { genericServerError } from "@/lib/api-error";
import { betaApplySchema, parseAndValidate } from "@/lib/validations/api";
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseAndValidate(body, betaApplySchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errorMessage }, { status: 400 });
  }
  const { name, email, phone, notes } = parsed.data;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("beta_applications")
    .insert({ name, email, phone, notes: notes ?? "" })
    .select("id, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An application with this email already exists." },
        { status: 409 },
      );
    }
    return genericServerError("beta/apply", error.message);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendBetaApplied({ adminEmail, name, email, phone, notes: notes ?? "" }).catch(
      console.error,
    );
  }

  return NextResponse.json({ id: data.id, status: data.status });
}
