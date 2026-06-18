// Client-side photo processing: downscale to a sane max dimension, bake in the
// correct EXIF orientation (so portrait phone shots don't end up sideways), and
// re-encode to WebP/JPEG so we don't carry around 5 MB originals.
export interface ProcessedImage {
  url: string;
  bytes: number;
}

export async function processImage(
  file: File,
  maxDim = 1280,
  quality = 0.82,
): Promise<ProcessedImage> {
  const bitmap = await decode(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Canvas unavailable — fall back to the original file untouched.
    return { url: URL.createObjectURL(file), bytes: file.size };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  const blob = (await encode(canvas, 'image/webp', quality)) ?? (await encode(canvas, 'image/jpeg', quality));
  if (!blob) return { url: URL.createObjectURL(file), bytes: file.size };
  return { url: URL.createObjectURL(blob), bytes: blob.size };
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap with imageOrientation applies EXIF rotation for us.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        /* fall through to <img> */
      }
    }
  }
  return loadImageEl(file);
}

function loadImageEl(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}
