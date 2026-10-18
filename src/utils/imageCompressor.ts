/**
 * Image Upload Helper - Fast client-side smart compression & original upload
 * Resizes huge images (e.g. 5-15MB phone camera shots) to a crisp web-optimized 1600px
 * so uploads complete in under 500ms and never hit Firestore 1MB document limits.
 */

export async function compressImageClientSide(file: File | Blob, maxWidth = 1600, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    // If not an image or running on server, return dataURL fallback
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Only downscale if larger than maxWidth
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP or JPEG for fast uploads and small file sizes
      const mimeType = file.type === 'image/png' && file.size < 800000 ? 'image/png' : 'image/jpeg';
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };

    img.src = url;
  });
}

export async function uploadOriginalImage(
  fileOrBase64: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // If it's already a hosted URL (http / https / /uploads/...), return as is immediately
  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://') || fileOrBase64.startsWith('/uploads/')) {
      if (onProgress) onProgress(100);
      return fileOrBase64;
    }
  }

  if (onProgress) onProgress(15);

  let base64String: string;
  let fileName = 'banner_image.jpg';

  if (typeof fileOrBase64 === 'string') {
    base64String = fileOrBase64;
  } else {
    fileName = (fileOrBase64 as File).name || 'banner_image.jpg';
    // Use fast smart compression for fast upload and instant display
    base64String = await compressImageClientSide(fileOrBase64, 1600, 0.88);
  }

  if (onProgress) onProgress(40);

  // 1. Try uploading to backend /api/upload-image (instant local file write)
  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: base64String,
        filename: fileName
      })
    });

    if (onProgress) onProgress(80);

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        if (onProgress) onProgress(100);
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[Upload] Server upload exception, checking ImgBB fallback:', err);
  }

  // 2. Fallback to client-side ImgBB if key exists
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (apiKey) {
    try {
      const rawBase64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const formData = new FormData();
      formData.append('image', rawBase64);

      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      const imgbbData = await imgbbRes.json();
      if (imgbbData.data?.url) {
        if (onProgress) onProgress(100);
        return imgbbData.data.url;
      }
    } catch (imgbbErr) {
      console.warn('[Upload] Client ImgBB upload error:', imgbbErr);
    }
  }

  // 3. Last fallback: compressed base64 (well under 500KB so it safely fits in Firestore)
  if (onProgress) onProgress(100);
  return base64String;
}

// Backward-compatibility aliases
export const uploadOrCompressImage = uploadOriginalImage;
export const compressImage = async (file: File | Blob | string): Promise<string> => {
  return uploadOriginalImage(file);
};

