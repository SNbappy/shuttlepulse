/**
 * Brevo (Sendinblue) OTP Email Verification Service
 * Dispatches 6-digit verification code to recipient inbox via Brevo SMTP API.
 */

export interface SendOtpResponse {
  success: boolean;
  otp: string;
  expiresAt: number;
  sentViaBrevo: boolean;
  pendingActivation?: boolean;
  devOtpPreview?: string;
  message: string;
}

export async function sendVerificationOtpEmail(
  email: string,
  name: string,
  customBrevoApiKey?: string
): Promise<SendOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Next.js Server API Route (Primary path on Web)
  try {
    const apiRes = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, name }),
    });

    const data = await apiRes.json();
    if (apiRes.ok && data?.success && data?.otp) {
      return {
        success: true,
        otp: data.otp,
        expiresAt: data.expiresAt,
        sentViaBrevo: Boolean(data.sentViaBrevo),
        pendingActivation: Boolean(data.pendingActivation),
        devOtpPreview: data.devOtpPreview,
        message: data.message,
      };
    } else {
      throw new Error(data?.message || "Failed to send verification email via Brevo.");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // 2. Direct Brevo v3 HTTPS call fallback (for static / Capacitor standalone mobile builds)
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
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 10 * 60 * 1000;

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; border-radius: 20px; border: 1px solid #e2e8f0; background: #ffffff;">
          <h2 style="margin: 0 0 12px; color: #064e3b; font-size: 20px;">ShuttlePulse Verification</h2>
          <p style="margin: 0 0 16px; color: #475569; font-size: 14px;">
            Hi ${name || "Player"}, use this 6-digit code to verify your membership and claim your <strong>500.00 TK</strong> balance:
          </p>
          <div style="background: #ecfdf5; border: 2px dashed #6ee7b7; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 16px;">
            <span style="font-family: monospace; font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #047857;">
              ${otp}
            </span>
          </div>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">This code expires in 10 minutes.</p>
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
          message: `A 6-digit verification code has been sent to ${cleanEmail} via Brevo.`,
        };
      } else {
        const directErr = await brevoRes.text();
        throw new Error(`Brevo Direct Error: ${directErr}`);
      }
    }

    throw new Error(errorMsg);
  }
}
