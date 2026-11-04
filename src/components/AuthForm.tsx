"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClub } from "@/context/ClubContext";
import PhotoDropzone from "@/components/PhotoDropzone";
import PasswordCriteriaBox from "@/components/PasswordCriteriaBox";
import { validatePassword } from "@/lib/passwordValidation";
import { sendVerificationOtpEmail, verifyOtpCode } from "@/lib/brevo";
import {
  MailCheck,
  Loader2,
  RotateCw,
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface AuthFormProps {
  initialMode?: "login" | "register" | "forgot_password";
}

type AuthMode = "login" | "register" | "forgot_password";
type AuthStep = "form" | "verify_otp" | "forgot_request" | "forgot_reset";

export default function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    users,
    login,
    registerMember,
    resetPasswordByEmail,
    imgbbApiKey,
  } = useClub();

  const queryMode =
    searchParams?.get("mode") === "register"
      ? "register"
      : searchParams?.get("mode") === "forgot"
      ? "forgot_password"
      : "login";

  const resolvedInitialMode = initialMode || queryMode;
  const [mode, setMode] = useState<AuthMode>(resolvedInitialMode);
  const [step, setStep] = useState<AuthStep>(
    resolvedInitialMode === "forgot_password" ? "forgot_request" : "form"
  );

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [playStyle, setPlayStyle] = useState("All-Court Player");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification states
  const [submitting, setSubmitting] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Handle Sign In submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = login(email, password);
    if (res.success) {
      router.push("/");
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // Handle Registration Step 1: Validate strong password & send OTP
  const handleRegisterSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      setFeedback({
        type: "error",
        text: "An account with this email address already exists. Please sign in.",
      });
      return;
    }

    // Enforce 5-criteria regex standard
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      setFeedback({
        type: "error",
        text: "Please satisfy all 5 password requirements listed below before continuing.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const otpRes = await sendVerificationOtpEmail(
        normalizedEmail,
        name.trim(),
        "registration"
      );
      setVerificationToken(otpRes.verificationToken);
      setEnteredOtp("");
      setStep("verify_otp");
      setResendCountdown(60);
      // Clear generic top alert so we don't display duplicate banners
      setFeedback(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not send verification email.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Registration Step 2: Verify OTP and activate member
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!verificationToken) {
      setFeedback({
        type: "error",
        text: "Verification session expired. Please request a new code.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const verifyRes = await verifyOtpCode(
        email,
        enteredOtp,
        verificationToken,
        "registration"
      );

      if (!verifyRes.success) {
        setFeedback({ type: "error", text: verifyRes.message });
        setSubmitting(false);
        return;
      }

      // Code confirmed -> Register user with 500.00 TK
      const res = registerMember(name, email, password, playStyle, avatarUrl);
      if (res.success) {
        setStep("form");
        setVerificationToken(null);
        setName("");
        setEmail("");
        setPassword("");
        setAvatarUrl(undefined);
        router.push("/");
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Verification code check failed.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Forgot Password Step 1: Send Reset OTP to user's email
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const normalizedEmail = email.trim().toLowerCase();
    const account = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!account) {
      setFeedback({
        type: "error",
        text: "No account found with this email address.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const otpRes = await sendVerificationOtpEmail(
        normalizedEmail,
        account.name,
        "reset_password"
      );
      setVerificationToken(otpRes.verificationToken);
      setEnteredOtp("");
      setStep("forgot_reset");
      setResendCountdown(60);
      // Clear generic top alert so we don't display duplicate banners
      setFeedback(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to send password reset email.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Forgot Password Step 2: Verify OTP and save new password
  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Enforce 5-criteria regex standard
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      setFeedback({
        type: "error",
        text: "Your new password must satisfy all 5 requirements listed below.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: "error",
        text: "New passwords do not match. Please re-enter.",
      });
      return;
    }

    if (!verificationToken) {
      setFeedback({
        type: "error",
        text: "Reset session expired. Please request a new code.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const verifyRes = await verifyOtpCode(
        email,
        enteredOtp,
        verificationToken,
        "reset_password"
      );

      if (!verifyRes.success) {
        setFeedback({ type: "error", text: verifyRes.message });
        setSubmitting(false);
        return;
      }

      // Verified -> Update user's password in database
      const resetRes = resetPasswordByEmail(email, newPassword);
      if (resetRes.success) {
        setMode("login");
        setStep("form");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setVerificationToken(null);
        setFeedback({
          type: "success",
          text: "Password updated successfully! Please sign in with your new password.",
        });
      } else {
        setFeedback({ type: "error", text: resetRes.message });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Password reset failed.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up mx-auto max-w-md px-4 pt-5 pb-10 space-y-4">
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm">
        {/* Navigation Tabs (Sign In vs Register) - Hidden in Forgot Password mode */}
        {mode !== "forgot_password" && (
          <div className="grid grid-cols-2 rounded-xl bg-emerald-950/5 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setStep("form");
                setFeedback(null);
              }}
              className={`whitespace-nowrap rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === "login"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setStep("form");
                setFeedback(null);
              }}
              className={`whitespace-nowrap rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === "register"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Register (+500.00 TK)
            </button>
          </div>
        )}

        {/* Header Title & Subtitle */}
        <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
          {mode === "login" && "Sign In to ShuttlePulse"}
          {mode === "register" &&
            (step === "verify_otp"
              ? "Verify Your Email"
              : "Create Member Account")}
          {mode === "forgot_password" &&
            (step === "forgot_reset"
              ? "Reset Your Password"
              : "Recover Your Password")}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {mode === "login" &&
            "Sign in with your registered email and password."}
          {mode === "register" &&
            (step === "verify_otp"
              ? `Enter the 6-digit code sent to ${email}.`
              : "Register with email verification to receive your 500.00 TK welcome token balance.")}
          {mode === "forgot_password" &&
            (step === "forgot_reset"
              ? `Enter the 6-digit code sent to ${email} and choose a strong password.`
              : "Enter your registered email address to receive a secure password reset code.")}
        </p>

        {/* Single Feedback Alert Banner */}
        {feedback && (
          <div
            className={`mt-4 rounded-xl border p-3 text-xs font-medium flex items-start gap-2 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed">{feedback.text}</p>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: Sign In View                                          */}
        {/* ============================================================== */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setStep("forgot_request");
                    setFeedback(null);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
            >
              Sign In
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: Registration - Step 1: Input Profile & Strong Password */}
        {/* ============================================================== */}
        {mode === "register" && step === "form" && (
          <form onSubmit={handleRegisterSendOtp} className="mt-4 space-y-3.5">
            <PhotoDropzone
              name={name || "M"}
              avatarUrl={avatarUrl}
              apiKey={imgbbApiKey}
              onPhotoChange={(url, msg) => {
                setAvatarUrl(url);
                if (msg) setFeedback({ type: "success", text: msg });
              }}
            />

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Create Strong Password
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Real-time regex password criteria checklist */}
              <PasswordCriteriaBox password={password} showAlways={true} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Play Style
              </label>
              <select
                value={playStyle}
                onChange={(e) => setPlayStyle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="Aggressive Smasher">Aggressive Smasher</option>
                <option value="All-Court Player">All-Court Player</option>
                <option value="Net Specialist">Net Specialist</option>
                <option value="Defensive Counter">Defensive Counter</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {submitting
                ? "Sending Verification Code..."
                : "Send Verification Code (+500.00 TK)"}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: Registration - Step 2: 6-Digit Email OTP Verification  */}
        {/* ============================================================== */}
        {mode === "register" && step === "verify_otp" && (
          <form onSubmit={handleVerifyRegisterOtp} className="mt-4 space-y-4">
            {/* Single clean notice card */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Verification Code Sent
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                  We sent a 6-digit code to <strong>{email}</strong>. Please check your inbox and spam folder.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={enteredOtp}
                onChange={(e) =>
                  setEnteredOtp(e.target.value.replace(/\D/g, ""))
                }
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-xl font-extrabold tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || enteredOtp.length !== 6}
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="h-4 w-4" />
              )}
              Verify & Activate Account (+500.00 TK)
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Edit Details
              </button>
              <button
                type="button"
                disabled={submitting || resendCountdown > 0}
                onClick={handleRegisterSendOtp}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-600 disabled:text-slate-400"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${submitting ? "animate-spin" : ""}`}
                />
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: Forgot Password - Step 1: Request Code                 */}
        {/* ============================================================== */}
        {mode === "forgot_password" && step === "forgot_request" && (
          <form onSubmit={handleForgotSendOtp} className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !email.includes("@")}
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {submitting ? "Sending Reset Code..." : "Send Reset Code"}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStep("form");
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: Forgot Password - Step 2: Verify OTP & Set New Password*/}
        {/* ============================================================== */}
        {mode === "forgot_password" && step === "forgot_reset" && (
          <form onSubmit={handleForgotResetSubmit} className="mt-4 space-y-3.5">
            {/* Single clean notice card */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Password Reset Code Sent
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                  We sent a 6-digit reset code to <strong>{email}</strong>. Check your inbox and spam folder.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={enteredOtp}
                onChange={(e) =>
                  setEnteredOtp(e.target.value.replace(/\D/g, ""))
                }
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center font-mono text-lg font-bold tracking-[0.3em] text-slate-900 placeholder-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Create New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a strong new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password criteria checklist for reset */}
              <PasswordCriteriaBox password={newPassword} showAlways={true} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || enteredOtp.length !== 6}
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Set New Password
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("forgot_request");
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change Email
              </button>
              <button
                type="button"
                disabled={submitting || resendCountdown > 0}
                onClick={handleForgotSendOtp}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-600 disabled:text-slate-400"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${submitting ? "animate-spin" : ""}`}
                />
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Resend Code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
