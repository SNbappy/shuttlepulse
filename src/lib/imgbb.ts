/**
 * Compresses an image file in the browser into a square JPEG (360x360)
 * and uploads it to ImgBB (`https://api.imgbb.com/1/upload`).
 * Works seamlessly in both Next.js Web deployments and Capacitor Mobile App builds.
 */
export async function compressImageToBase64(
  file: File,
  maxSize = 360
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadPhotoToImgBB(
  file: File,
  apiKey?: string
): Promise<{ url: string; hostedOnImgBB: boolean; message?: string }> {
  const compressedDataUrl = await compressImageToBase64(file, 360);
  const rawKey =
    apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY || "";
  const cleanKey =
    rawKey && rawKey !== "your_imgbb_api_key_here" ? rawKey.trim() : "";

  // 1. Direct ImgBB API Upload (Works in both Web and Mobile App builds)
  if (cleanKey) {
    try {
      const base64Clean = compressedDataUrl.replace(
        /^data:image\/[a-zA-Z+]+;base64,/,
        ""
      );
      const formData = new FormData();
      formData.append("image", base64Clean);

      const imgbbRes = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(cleanKey)}`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await imgbbRes.json();
      if (imgbbRes.ok && data?.success && data?.data?.display_url) {
        return {
          url: data.data.display_url,
          hostedOnImgBB: true,
          message: "Photo uploaded to ImgBB cloud storage.",
        };
      }
    } catch (err) {
      console.warn("Direct ImgBB upload fallback:", err);
    }
  }

  // 2. Try Next.js Server Route `/api/upload-image` (if server-side IMGBB_API_KEY is set)
  try {
    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: compressedDataUrl,
        apiKey: cleanKey || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.url) {
        return {
          url: data.url,
          hostedOnImgBB: Boolean(data.hostedOnImgBB),
          message: data.message,
        };
      }
    }
  } catch {
    // Offline or static mobile build fallback
  }

  return {
    url: compressedDataUrl,
    hostedOnImgBB: false,
    message:
      "Photo attached (set NEXT_PUBLIC_IMGBB_API_KEY at deployment for cloud hosting).",
  };
}
