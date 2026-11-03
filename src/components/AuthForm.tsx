"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClub } from "@/context/ClubContext";
import PhotoDropzone from "@/components/PhotoDropzone";
import { sendVerificationOtpEmail } from "@/lib/brevo";
import {
  MailCheck,
  Loader2,
  RotateCw,
  Mail,
} from "lucide-react";

interface AuthFormProps {
  initialMode?: "login" | "register";
}

export default function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users, login, registerMember, imgbbApiKey, brevoApiKey } = useClub();

  const queryMode = searchParams?.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"register" | "login">(
    initialMode || queryMode
  );
  const [step, setStep] = useState<"form" | "verify_otp">("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playStyle, setPlayStyle] = useState("All-Court Player");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Brevo Transactional OTP Verification states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
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

  const triggerSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      setFeedback({
        type: "error",
        text: "An account with this email address already exists.",
      });
      return;
    }

    setSendingOtp(true);
    setFeedback(null);

    try {
      const otpRes = await sendVerificationOtpEmail(
        normalizedEmail,
        name.trim(),
        brevoApiKey
      );
      setGeneratedOtp(otpRes.otp);
      setOtpExpiresAt(otpRes.expiresAt);
      setEnteredOtp("");
      setStep("verify_otp");
      setResendCountdown(60);

      setFeedback({
        type: "success",
        text: otpRes.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not send verification OTP.";
      setFeedback({
        type: "error",
        text: msg,
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (mode === "login") {
      const res = login(email, password);
      if (res.success) {
        router.push("/");
      } else {
        setFeedback({ type: "error", text: res.message });
      }
      return;
    }

    // Registration -> Send Real Transactional OTP via Brevo
    await triggerSendOtp();
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!generatedOtp || Date.now() > otpExpiresAt) {
      setFeedback({
        type: "error",
        text: "Verification code has expired. Please request a new OTP.",
      });
      return;
    }

    if (enteredOtp.trim() !== generatedOtp) {
      setFeedback({
        type: "error",
        text: "Invalid 6-digit OTP code. Please check your email inbox and try again.",
      });
      return;
    }

    // OTP Verified -> Create Member Account (+500.00 TK)
    const res = registerMember(name, email, password, playStyle, avatarUrl);
    if (res.success) {
      setStep("form");
      setGeneratedOtp(null);
      setName("");
      setEmail("");
      setPassword("");
      setAvatarUrl(undefined);
      router.push("/");
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="animate-fade-up mx-auto max-w-md px-4 pt-5 pb-10 space-y-4">
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm">
        {/* Segmented Control */}
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

        <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
          {mode === "login"
            ? "Sign In to ShuttlePulse"
            : step === "verify_otp"
            ? "Verify Your Email Address"
            : "Create Member Account"}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {mode === "login"
            ? "Sign in with your registered email and password."
            : step === "verify_otp"
            ? `Enter the 6-digit code sent to ${email} to activate your account.`
            : "Register with email verification to receive your 500.00 TK welcome token balance."}
        </p>

        {feedback && (
          <div
            className={`mt-4 rounded-xl border p-3 text-xs font-medium ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <p>{feedback.text}</p>
          </div>
        )}

        {/* STEP 2: Real Brevo 6-Digit OTP Verification View */}
        {mode === "register" && step === "verify_otp" ? (
          <form onSubmit={handleVerifyOtpSubmit} className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Email Verification Sent
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                  We sent a 6-digit verification code to <strong>{email}</strong>. Please check your inbox and spam folder.
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
              disabled={enteredOtp.length !== 6}
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              <MailCheck className="h-4 w-4" />
              Verify & Activate Account (+500.00 TK)
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="font-medium text-slate-500 hover:text-slate-800"
              >
                ← Edit Details
              </button>
              <button
                type="button"
                disabled={sendingOtp || resendCountdown > 0}
                onClick={triggerSendOtp}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-600 disabled:text-slate-400"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${sendingOtp ? "animate-spin" : ""}`}
                />
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: Login or Registration Details Form */
          <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5">
            {mode === "register" && (
              <>
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
              </>
            )}

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
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            {mode === "register" && (
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
            )}

            <button
              type="submit"
              disabled={sendingOtp}
              className="btn-interactive btn-shine w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {sendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "register"
                ? sendingOtp
                  ? "Sending Verification OTP..."
                  : "Send Verification Code (+500.00 TK)"
                : "Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
