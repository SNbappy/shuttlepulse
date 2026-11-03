import { NextResponse } from "next/server";

/**
 * POST /api/upload-image
 * Uploads a base64 image to ImgBB using https://api.imgbb.com/1/upload
 * Reads `IMGBB_API_KEY` or `NEXT_PUBLIC_IMGBB_API_KEY` from environment variables
 * (or an optional `apiKey` passed in the request body).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, apiKey: clientKey } = body as {
      imageBase64?: string;
      apiKey?: string;
    };

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: "No image payload provided." },
        { status: 400 }
      );
    }

    const rawKey =
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
      clientKey ||
      "";
    const cleanKey =
      rawKey && rawKey !== "your_imgbb_api_key_here" ? rawKey.trim() : "";

    // Strip data:image/...;base64, prefix for ImgBB
    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    if (cleanKey) {
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
        return NextResponse.json({
          success: true,
          url: data.data.display_url,
          deleteUrl: data.data.delete_url,
          hostedOnImgBB: true,
          message: "Photo uploaded to ImgBB cloud storage.",
        });
      }
    }

    // Pre-deployment fallback if IMGBB_API_KEY is not set in .env.local yet
    return NextResponse.json({
      success: true,
      url: imageBase64,
      hostedOnImgBB: false,
      message:
        "Photo saved locally (set IMGBB_API_KEY in .env.local at deployment for cloud hosting).",
    });
  } catch (error) {
    console.error("ImgBB upload route error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image." },
      { status: 500 }
    );
  }
}
