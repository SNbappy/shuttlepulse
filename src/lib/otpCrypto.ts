import crypto from "crypto";

const OTP_SECRET =
  process.env.BREVO_API_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "shuttlepulse-secure-otp-salt-production-2026";

/**
 * Generates an opaque, HMAC-signed verification token.
 * Plaintext OTP is NEVER stored in the token or returned to the browser.
 */
export function generateVerificationToken(
  email: string,
  otp: string,
  expiresAt: number,
  purpose: "registration" | "reset_password" = "registration"
): string {
  const cleanEmail = email.trim().toLowerCase();
  const payload = `${cleanEmail}:${otp}:${expiresAt}:${purpose}`;
  const hmac = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");

  // Format: email|expiresAt|purpose|hmac
  const tokenString = `${cleanEmail}|${expiresAt}|${purpose}|${hmac}`;
  return Buffer.from(tokenString, "utf8").toString("base64url");
}

/**
 * Validates the user's entered OTP against the signed verification token.
 */
export function verifyOtpToken(
  email: string,
  enteredOtp: string,
  token: string,
  expectedPurpose: "registration" | "reset_password" = "registration"
): { valid: boolean; reason?: string } {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = enteredOtp.trim().replace(/\D/g, "");

    if (cleanOtp.length !== 6) {
      return { valid: false, reason: "Verification code must be 6 digits." };
    }

    if (!token || typeof token !== "string") {
      return { valid: false, reason: "Missing or invalid verification token." };
    }

    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");

    if (parts.length < 3) {
      return { valid: false, reason: "Malformed verification token." };
    }

    let tokenEmail = "";
    let expiresAtStr = "";
    let tokenPurpose = "registration";
    let expectedHmac = "";

    if (parts.length === 4) {
      [tokenEmail, expiresAtStr, tokenPurpose, expectedHmac] = parts;
    } else {
      [tokenEmail, expiresAtStr, expectedHmac] = parts;
    }

    if (!tokenEmail || !expiresAtStr || !expectedHmac) {
      return { valid: false, reason: "Malformed verification token." };
    }

    if (tokenEmail !== cleanEmail) {
      return { valid: false, reason: "Verification code does not match this email address." };
    }

    if (tokenPurpose !== expectedPurpose) {
      return { valid: false, reason: "Verification token purpose mismatch." };
    }

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: "Verification code has expired. Please request a new code." };
    }

    const payload =
      parts.length === 4
        ? `${cleanEmail}:${cleanOtp}:${expiresAt}:${tokenPurpose}`
        : `${cleanEmail}:${cleanOtp}:${expiresAt}`;

    const computedHmac = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedHmac, "hex");
    const computedBuffer = Buffer.from(computedHmac, "hex");

    if (
      expectedBuffer.length !== computedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, computedBuffer)
    ) {
      return {
        valid: false,
        reason: "Invalid 6-digit verification code. Please check your email and try again.",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid verification token format." };
  }
}
