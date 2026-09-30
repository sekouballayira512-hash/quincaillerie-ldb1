/**
 * Utility functions for client-side image processing, compression and formatting.
 * Optimizes images selected from device (camera, gallery, files) to lightweight
 * Base64 JPEG/WebP data URLs safe for Firestore documents (< 1MB).
 */

export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  format: string;
}

/**
 * Format bytes into human-readable size string (Ko, Mo)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 Ko';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Resizes and compresses an image File from the device.
 * Maintains aspect ratio, caps dimensions to maxWidth/maxHeight,
 * and encodes as JPEG with controlled quality to keep document size well under 250KB.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier depuis l\'appareil.'));

    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format d\'image non supporté ou fichier corrompu.'));

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute target dimensions preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Impossible d\'initialiser le contexte graphique.'));
          }

          // Fill white background to avoid transparent black artifact on transparent PNG -> JPEG conversion
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw scaled image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG (universal compatibility & great compression)
          let outputQuality = quality;
          let dataUrl = canvas.toDataURL('image/jpeg', outputQuality);

          // If result is still over 500KB (e.g. extremely detailed texture), do a second pass with lower quality
          let estimatedBytes = Math.round((dataUrl.length * 3) / 4);
          if (estimatedBytes > 450 * 1024) {
            outputQuality = 0.65;
            dataUrl = canvas.toDataURL('image/jpeg', outputQuality);
            estimatedBytes = Math.round((dataUrl.length * 3) / 4);
          }

          resolve({
            dataUrl,
            width,
            height,
            sizeBytes: estimatedBytes,
            originalSizeBytes: file.size,
            format: 'image/jpeg',
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
