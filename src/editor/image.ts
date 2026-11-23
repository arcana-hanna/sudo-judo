/** Liest ein Bild und verkleinert es auf max. 900 px, damit exportierte Dateien klein bleiben. */
export async function fileToDataUrl(file: File, max = 900): Promise<string> {
  if (file.type === 'image/svg+xml') return readAsDataUrl(file);
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.82);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

/** Wie fileToDataUrl, liefert zusätzlich die Maße (für Seitenverhältnisse). */
export async function fileToImage(file: File, max = 900): Promise<{ url: string; w: number; h: number }> {
  if (file.type === 'image/svg+xml') {
    const url = await readAsDataUrl(file);
    const img = new Image(); img.src = url; await img.decode().catch(() => {});
    return { url, w: img.naturalWidth || 600, h: img.naturalHeight || 400 };
  }
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  return { url: file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.82), w, h };
}
