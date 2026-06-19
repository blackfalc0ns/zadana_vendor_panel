const MIN_OPTIMIZATION_BYTES = 32 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

const OPTIMIZABLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp'
]);

export type ImageUploadPhase = 'preparing' | 'uploading';

export interface ImageUploadProgress {
  percent: number;
  phase: ImageUploadPhase;
}

export function shouldOptimizeImageForUpload(file: File): boolean {
  return file.size >= MIN_OPTIMIZATION_BYTES &&
    OPTIMIZABLE_IMAGE_TYPES.has(file.type.toLowerCase()) &&
    typeof createImageBitmap === 'function';
}

export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!shouldOptimizeImageForUpload(file)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / bitmap.width,
        MAX_IMAGE_DIMENSION / bitmap.height
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { alpha: true });
      if (!context) {
        return file;
      }

      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
      );

      if (!blob) {
        return file;
      }

      if (file.type.toLowerCase() === 'image/webp' && scale === 1 && blob.size >= file.size) {
        return file;
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
      return new File([blob], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: file.lastModified
      });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}
