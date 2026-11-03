import { NextResponse } from "next/server";

/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP and sends a transactional verification email via
 * Brevo (Sendinblue) v3 SMTP API: https://api.brevo.com/v3/smtp/email
 *
 * Environment Variables used at deployment:
 *   - BREVO_API_KEY
 *   - BREVO_SENDER_EMAIL
 *   - BREVO_SENDER_NAME
 */
export async function POST(req: Request) {
  try {
    const { email, name } = (await req.json()) as {
      email?: string;
      name?: string;
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid email address is required." },
        { status: 400 }
      );
    }

    // Generate 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    const brevoApiKey = process.env.BREVO_API_KEY?.trim() || "";
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL?.trim() || "no-reply@shuttlepulse.com";
    const senderName =
      process.env.BREVO_SENDER_NAME?.trim() || "ShuttlePulse Badminton Club";

    const isKeyConfigured =
      brevoApiKey.length > 0 && brevoApiKey !== "your_brevo_api_key_here";

    if (isKeyConfigured) {
      const htmlContent = `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; background: #ffffff;">
          <h2 style="margin: 0 0 8px; color: #064e3b; font-size: 20px;">ShuttlePulse Account Verification</h2>
          <p style="margin: 0 0 16px; color: #475569; font-size: 14px;">
            Hi ${name || "Player"}, use the 6-digit verification code below to verify your club membership and claim your <strong>500 TK</strong> Shuttle Token balance:
          </p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px;">
            <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #047857;">
              ${otp}
            </span>
          </div>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            This code expires in 10 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      `;

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: email.trim(), name: name || "Club Member" }],
          subject: `${otp} is your ShuttlePulse verification code`,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        return NextResponse.json({
          success: true,
          otp,
          expiresAt,
          sentViaBrevo: true,
          message: `A 6-digit verification OTP has been sent to ${email} via Brevo.`,
        });
      } else {
        const errBody = await brevoRes.text();
        console.warn("Brevo API returned non-200:", errBody);
        return NextResponse.json({
          success: true,
          otp,
          expiresAt,
          sentViaBrevo: false,
          devOtpPreview: otp,
          message:
            "Brevo API key returned an error; showing fallback OTP for testing.",
        });
      }
    }

    // Pre-deployment mode when BREVO_API_KEY is not yet added to .env.local
    return NextResponse.json({
      success: true,
      otp,
      expiresAt,
      sentViaBrevo: false,
      devOtpPreview: otp,
      message: `Verification code generated for ${email}. (Add BREVO_API_KEY in .env.local at deployment to send live emails).`,
    });
  } catch (error) {
    console.error("Brevo send-otp route error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate verification OTP." },
      { status: 500 }
    );
  }
}
