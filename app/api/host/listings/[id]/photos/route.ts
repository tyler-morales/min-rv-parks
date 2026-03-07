import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const BUCKET = "listing-photos";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("host_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${listingId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: photos } = await supabase
    .from("listing_photos")
    .select("position")
    .eq("listing_id", listingId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (photos?.[0]?.position ?? -1) + 1;

  const { data: photoRow, error: insertError } = await supabase
    .from("listing_photos")
    .insert({
      listing_id: listingId,
      url: publicUrl,
      storage_path: path,
      position,
    })
    .select("id, url")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: photoRow.id, url: photoRow.url });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  const { data: photo } = await supabase
    .from("listing_photos")
    .select("storage_path, listing_id")
    .eq("id", photoId)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  if (photo.listing_id !== listingId) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", photo.listing_id)
    .eq("host_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  await supabase.from("listing_photos").delete().eq("id", photoId);

  return NextResponse.json({ ok: true });
}
