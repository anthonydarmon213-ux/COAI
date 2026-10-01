import sharp from "sharp";

const FORMATS: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };

/** Decode before any storage write. Never trust a client-provided MIME type. */
export async function isReadableAvatar(file: File): Promise<boolean> {
  if (!FORMATS[file.type] || !file.size || file.size > 2 * 1024 * 1024) return false;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      failOn: "warning", limitInputPixels: 16_000_000,
    });
    const metadata = await image.metadata();
    if (metadata.format !== FORMATS[file.type] || (metadata.pages ?? 1) !== 1) return false;
    // Metadata alone cannot detect truncated pixel data. Decode the whole image;
    // the pixel limit bounds the allocation even for highly compressed input.
    await image.raw().toBuffer();
    return true;
  } catch {
    return false;
  }
}
