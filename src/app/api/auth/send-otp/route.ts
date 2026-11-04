import { NextResponse } from "next/server";
import { generateVerificationToken } from "@/lib/otpCrypto";

/**
 * POST /api/auth/send-otp
 * Production Transactional Email Verification via Brevo (Sendinblue) v3 SMTP API:
 * https://api.brevo.com/v3/smtp/email
 *
 * Environment Variables:
 *   - BREVO_API_KEY: v3 API key from Brevo dashboard (starts with xkeysib-...)
 *   - BREVO_SENDER_EMAIL: Sender email address verified in your Brevo account (e.g. bappy.just@gmail.com)
 *   - BREVO_SENDER_NAME: Display name of the sender
 */
export async function POST(req: Request) {
  try {
    const { email, name, purpose } = (await req.json()) as {
      email?: string;
      name?: string;
      purpose?: "registration" | "reset_password";
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenPurpose =
      purpose === "reset_password" ? "reset_password" : "registration";

    // Generate secure 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    const brevoApiKey =
      process.env.BREVO_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_BREVO_API_KEY?.trim() ||
      "";
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL?.trim() ||
      process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL?.trim() ||
      "bappy.just@gmail.com";
    const senderName =
      process.env.BREVO_SENDER_NAME?.trim() ||
      process.env.NEXT_PUBLIC_BREVO_SENDER_NAME?.trim() ||
      "ShuttlePulse Badminton Club";

    const isKeyConfigured =
      brevoApiKey.length > 0 && brevoApiKey !== "your_brevo_api_key_here";

    if (!isKeyConfigured) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Brevo API key is not configured in server environment. Please set BREVO_API_KEY.",
        },
        { status: 500 }
      );
    }

    // Generate HMAC-signed verification token containing the hashed OTP
    const verificationToken = generateVerificationToken(
      cleanEmail,
      otp,
      expiresAt,
      tokenPurpose
    );

    const isReset = tokenPurpose === "reset_password";
    const emailSubject = isReset
      ? `${otp} is your ShuttlePulse password reset code`
      : `${otp} is your ShuttlePulse verification code`;

    const headline = isReset
      ? "Password Reset Request"
      : "Club Membership Verification";

    const instruction = isReset
      ? `Use the 6-digit verification code below to securely reset your password for your ShuttlePulse account:`
      : `Use the 6-digit verification code below to verify your email address and activate your ShuttlePulse club account with a welcome balance of <strong>500.00 TK</strong>:`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; border-radius: 20px; border: 1px solid #e2e8f0; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; color: #064e3b; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
            Shuttle<span style="color: #059669;">Pulse</span>
          </h1>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 12px; font-weight: 500;">
            ${headline}
          </p>
        </div>

        <p style="margin: 0 0 16px; color: #334155; font-size: 14px; line-height: 1.6;">
          Hi <strong>${name || "Player"}</strong>,
        </p>
        <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
          ${instruction}
        </p>

        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px dashed #6ee7b7; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #047857;">
            ${otp}
          </span>
        </div>

        <p style="margin: 0 0 24px; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
          This verification code is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
        </p>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px;" />
        <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center;">
          ShuttlePulse Badminton Club • Developed by Md. Sabbir Hossain Bappy at CyberSecurity Lab
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
        to: [{ email: cleanEmail, name: name || "Club Member" }],
        subject: emailSubject,
        htmlContent,
      }),
    });

    if (brevoRes.ok) {
      return NextResponse.json({
        success: true,
        verificationToken,
        expiresAt,
        message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox and spam folder.`,
      });
    } else {
      const errText = await brevoRes.text();
      let errMessage = "Brevo transactional email delivery failed.";
      let errCode = "";
      try {
        const errJson = JSON.parse(errText);
        errMessage = errJson.message || errJson.code || errText;
        errCode = errJson.code || "";
      } catch {
        errMessage = errText;
      }

      console.warn("Brevo API error:", { errCode, errMessage });

      if (
        errCode === "permission_denied" ||
        errMessage.toLowerCase().includes("not yet activated")
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your Brevo transactional SMTP relay is pending one-time activation. Please visit your Brevo dashboard (Transactional > Settings) or contact Brevo to activate SMTP relay.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: `Email delivery error: ${errMessage}`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("send-otp route exception:", error);
    return NextResponse.json(
      { success: false, message: "Failed to dispatch verification email." },
      { status: 500 }
    );
  }
}
