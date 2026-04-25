const MAX_DIMENSION = 1024;
const QUALITY = 0.7;

/**
 * Compresses and resizes an image File using an off-screen canvas.
 * Returns a pure base64 string (no data-URL prefix) at ≤1024px and 70% quality.
 */
export async function compressImageToBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  const { width: origW, height: origH } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(origW, origH));
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: QUALITY });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1]); // strip "data:image/jpeg;base64," prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
