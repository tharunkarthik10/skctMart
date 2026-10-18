/**
 * Universal Client-Side Image Compression Utility
 * Resizes large images (camera photos, screenshots, high-res posters) and compresses
 * them into lightweight WebP/JPEG format to drastically accelerate uploads and page loads.
 */

export const compressImage = (fileOrBlob, options = {}) => {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    preferredMimeType = 'image/webp',
    fallbackMimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    if (!fileOrBlob) {
      return reject(new Error('No file provided for compression.'));
    }

    // Pass through SVGs or non-image files
    if (fileOrBlob.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        file: fileOrBlob,
        dataUrl: e.target.result,
        size: fileOrBlob.size,
        originalSize: fileOrBlob.size,
        compressionRatio: '0%'
      });
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }

        // Enable high-quality downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill transparent backgrounds for JPEGs
        if (fallbackMimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Check if WebP is supported, otherwise fallback to JPEG
        let targetType = preferredMimeType;
        let dataUrl = canvas.toDataURL(targetType, quality);

        if (!dataUrl.startsWith(`data:${targetType}`)) {
          targetType = fallbackMimeType;
          dataUrl = canvas.toDataURL(targetType, quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas blob generation failed.'));
            }

            const fileName = (fileOrBlob.name || 'image').replace(/\.[^/.]+$/, '') + (targetType === 'image/webp' ? '.webp' : '.jpg');
            const compressedFile = new File([blob], fileName, {
              type: targetType,
              lastModified: Date.now()
            });

            const originalSize = fileOrBlob.size || 0;
            const finalSize = compressedFile.size;
            const ratio = originalSize > 0 
              ? `${Math.max(0, Math.round(((originalSize - finalSize) / originalSize) * 100))}% smaller`
              : 'compressed';

            resolve({
              file: compressedFile,
              dataUrl,
              width,
              height,
              size: finalSize,
              originalSize,
              compressionRatio: ratio
            });
          },
          targetType,
          quality
        );
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(fileOrBlob);
  });
};

/**
 * Convenient shortcut to get just the compressed DataURL string
 */
export const compressImageToDataUrl = async (fileOrBlob, options = {}) => {
  const result = await compressImage(fileOrBlob, options);
  return result.dataUrl;
};
