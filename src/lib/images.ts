/** Shrink photos in the browser before upload so pages stay fast on mobile data. */
export async function compressImage(
  file: File,
  { maxSize = 1600, quality = 0.82 }: { maxSize?: number; quality?: number } = {}
): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG or WebP).');
  if (file.type === 'image/svg+xml') throw new Error('SVG files are not supported. Export the picture as PNG or JPG.');
  // Keep animated GIFs exactly as they are.
  if (file.type === 'image/gif') {
    if (file.size > 3 * 1024 * 1024) throw new Error('That file is over 3 MB. Use a smaller one.');
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That image could not be read. Try a JPG, PNG or WebP.'));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not process this image.');
    ctx.drawImage(img, 0, 0, w, h);

    const toBlob = (type: string, q?: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));

    // PNGs (logos, screenshots) stay PNG unless that gets large.
    if (file.type === 'image/png') {
      const png = await toBlob('image/png');
      if (png && png.size < 1.2 * 1024 * 1024) return png;
    }
    const jpeg = await toBlob('image/jpeg', quality);
    if (!jpeg) throw new Error('Your browser could not process this image.');
    return jpeg;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function extensionFor(blob: Blob): string {
  if (blob.type === 'image/png') return 'png';
  if (blob.type === 'image/gif') return 'gif';
  return 'jpg';
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read the image.'));
    r.readAsDataURL(blob);
  });
}
