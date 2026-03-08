/**
 * Server-side validation for listing photo uploads.
 * Enforces size, MIME whitelist, magic-byte check, and safe path construction.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIMES = ["image/jpeg", "image/png"] as const;
export type AllowedMime = (typeof ALLOWED_MIMES)[number];

const MAGIC: Record<AllowedMime, Uint8Array[]> = {
  "image/jpeg": [
    new Uint8Array([0xff, 0xd8, 0xff]),
  ],
  "image/png": [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ],
};

const MIME_TO_EXT: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

function bufferMatchesSignature(buffer: Uint8Array, signature: Uint8Array): boolean {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Validates file size, MIME, and magic bytes. Returns the allowed MIME and safe extension, or throws.
 */
export async function validateListingPhoto(file: File): Promise<{ mime: AllowedMime; ext: string }> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Invalid or unsupported image");
  }
  const mime = file.type?.toLowerCase();
  if (!mime || !ALLOWED_MIMES.includes(mime as AllowedMime)) {
    throw new Error("Invalid or unsupported image");
  }
  const signatures = MAGIC[mime as AllowedMime];
  const buf = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buf);
  const matches = signatures.some((sig) => bufferMatchesSignature(bytes, sig));
  if (!matches) {
    throw new Error("Invalid or unsupported image");
  }
  return { mime: mime as AllowedMime, ext: MIME_TO_EXT[mime as AllowedMime] };
}
