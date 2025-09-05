import sharp from 'sharp';

export type ProcessedImage = {
  data: Buffer;
  width: number;
  height: number;
  contentType: 'image/webp';
  ext: 'webp';
};

/**
 * Resize and compress an input image buffer to WEBP with a max dimension of 640px.
 * - Preserves aspect ratio using fit: 'inside'
 * - Strips metadata
 * - Auto-rotates based on EXIF
 */
export async function processImageToWebp(
  input: Buffer,
  opts?: { maxSize?: number; quality?: number },
): Promise<ProcessedImage> {
  const maxSize = opts?.maxSize ?? 640;
  const quality = opts?.quality ?? 80;

  const img = sharp(input, { failOn: 'none' }).rotate();
  const resized = img.resize({
    width: maxSize,
    height: maxSize,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const pipe = resized.webp({ quality });
  const data = await pipe.toBuffer();
  const meta = await sharp(data).metadata();
  return {
    data,
    width: meta.width ?? maxSize,
    height: meta.height ?? maxSize,
    contentType: 'image/webp',
    ext: 'webp',
  };
}
