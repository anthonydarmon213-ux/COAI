const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.78;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export type OptimizedPhoto = {
  file: File;
  originalBytes: number;
  optimizedBytes: number;
};

export async function compressProgressPhoto(file: File): Promise<OptimizedPhoto> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Choisis une photo JPG, PNG, WebP, HEIC ou HEIF.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Cette photo dépasse 40 Mo.");
  }

  const image = await loadImage(file);
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Impossible de préparer cette photo.");
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  );
  if (!blob) throw new Error("Impossible de compresser cette photo.");
  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error("La photo reste trop volumineuse après optimisation. Choisis-en une autre.");
  }

  return {
    file: new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "progression"}.webp`, {
      type: "image/webp",
    }),
    originalBytes: file.size,
    optimizedBytes: blob.size,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cette image ne peut pas être lue."));
    };
    image.src = url;
  });
}
