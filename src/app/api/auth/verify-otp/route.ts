import { NextResponse } from "next/server";
import { verifyOtpToken } from "@/lib/otpCrypto";

/**
 * POST /api/auth/verify-otp
 * Verifies user's entered 6-digit OTP against HMAC signed token.
 */
export async function POST(req: Request) {
  try {
    const { email, enteredOtp, verificationToken, purpose } =
      (await req.json()) as {
        email?: string;
        enteredOtp?: string;
        verificationToken?: string;
        purpose?: "registration" | "reset_password";
      };

    if (!email || !enteredOtp || !verificationToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, verification code, and token are required.",
        },
        { status: 400 }
      );
    }

    const tokenPurpose =
      purpose === "reset_password" ? "reset_password" : "registration";

    const result = verifyOtpToken(
      email,
      enteredOtp,
      verificationToken,
      tokenPurpose
    );

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          message: result.reason || "Invalid verification code.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code confirmed successfully.",
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed." },
      { status: 500 }
    );
  }
}
