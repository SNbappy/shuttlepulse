import { NextResponse } from "next/server";

/**
 * POST /api/upload-image
 * Uploads a base64 or binary image directly to ImgBB CDN (https://api.imgbb.com/1/upload)
 * Environment Variable:
 *   - IMGBB_API_KEY: 32-character API key from https://api.imgbb.com/
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

    if (!cleanKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ImgBB API key is not configured. Please set IMGBB_API_KEY in environment variables.",
        },
        { status: 400 }
      );
    }

    // Strip data:image/...;base64, prefix for ImgBB
    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

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
        url: data.data.display_url || data.data.url,
        deleteUrl: data.data.delete_url,
        hostedOnImgBB: true,
        message: "Photo uploaded to ImgBB cloud storage.",
      });
    } else {
      const errMsg =
        data?.error?.message ||
        "ImgBB rejected image upload. Please check your IMGBB_API_KEY and image format.";
      return NextResponse.json(
        { success: false, message: errMsg },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("ImgBB upload route error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload image to ImgBB." },
      { status: 500 }
    );
  }
}
