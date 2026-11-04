/**
 * Brevo (Sendinblue) OTP Email Verification Service
 * Dispatches 6-digit verification code to recipient inbox via Brevo SMTP API.
 */

export interface SendOtpResponse {
  success: boolean;
  verificationToken: string;
  expiresAt: number;
  message: string;
}

export async function sendVerificationOtpEmail(
  email: string,
  name: string,
  purpose: "registration" | "reset_password" = "registration"
): Promise<SendOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();

  const apiRes = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail, name, purpose }),
  });

  const data = await apiRes.json();
  if (apiRes.ok && data?.success && data?.verificationToken) {
    return {
      success: true,
      verificationToken: data.verificationToken,
      expiresAt: data.expiresAt,
      message: data.message,
    };
  } else {
    throw new Error(data?.message || "Failed to send verification email via Brevo.");
  }
}

export async function verifyOtpCode(
  email: string,
  enteredOtp: string,
  verificationToken: string,
  purpose: "registration" | "reset_password" = "registration"
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  const apiRes = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: cleanEmail,
      enteredOtp,
      verificationToken,
      purpose,
    }),
  });

  const data = await apiRes.json();
  if (apiRes.ok && data?.success) {
    return {
      success: true,
      message: data.message || "Code verified successfully.",
    };
  } else {
    return {
      success: false,
      message: data?.message || "Invalid or expired verification code.",
    };
  }
}
