/**
 * Brevo (Sendinblue) OTP Email Verification Service
 * Works in both Web (via `/api/auth/send-otp` or direct HTTPS) and Capacitor Mobile App builds.
 * Reads `NEXT_PUBLIC_BREVO_API_KEY` orAdmin-configured Brevo key at deployment time.
 */

export interface SendOtpResponse {
  success: boolean;
  otp: string;
  expiresAt: number;
  sentViaBrevo: boolean;
  devOtpPreview?: string;
  message: string;
}

export async function sendVerificationOtpEmail(
  email: string,
  name: string,
  customBrevoApiKey?: string
): Promise<SendOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // 1. Try Next.js server API route first (when running on web server)
  try {
    const apiRes = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, name }),
    });
    if (apiRes.ok) {
      const data = (await apiRes.json()) as SendOtpResponse;
      if (data?.success && data?.otp) {
        return data;
      }
    }
  } catch {
    // Static mobile app build or offline fallback — proceed to direct Brevo call
  }

  // 2. Direct Brevo v3 HTTPS call (for static / Capacitor mobile app builds)
  const rawKey =
    customBrevoApiKey || process.env.NEXT_PUBLIC_BREVO_API_KEY || "";
  const brevoKey =
    rawKey && rawKey !== "your_brevo_api_key_here" ? rawKey.trim() : "";
  const senderEmail =
    process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL?.trim() ||
    "no-reply@shuttlepulse.com";
  const senderName =
    process.env.NEXT_PUBLIC_BREVO_SENDER_NAME?.trim() ||
    "ShuttlePulse Badminton Club";

  if (brevoKey) {
    try {
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
            This code expires in 10 minutes.
          </p>
        </div>
      `;

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: cleanEmail, name: name || "Club Member" }],
          subject: `${otp} is your ShuttlePulse verification code`,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        return {
          success: true,
          otp,
          expiresAt,
          sentViaBrevo: true,
          message: `A 6-digit verification OTP has been sent to ${cleanEmail} via Brevo.`,
        };
      }
    } catch (err) {
      console.warn("Direct Brevo request error:", err);
    }
  }

  return {
    success: true,
    otp,
    expiresAt,
    sentViaBrevo: false,
    devOtpPreview: otp,
    message: `Verification code generated for ${cleanEmail}. (Configure BREVO_API_KEY at deployment for live email delivery).`,
  };
}
