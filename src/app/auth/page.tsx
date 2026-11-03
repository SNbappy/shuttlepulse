"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useClub } from "@/context/ClubContext";
import PhotoDropzone from "@/components/PhotoDropzone";
import { sendVerificationOtpEmail } from "@/lib/brevo";
import {
  ArrowRight,
  MailCheck,
  Loader2,
  RotateCw,
  ShieldCheck,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { users, login, registerMember, imgbbApiKey, brevoApiKey } = useClub();

  const [mode, setMode] = useState<"register" | "login">("login");
  const [step, setStep] = useState<"form" | "verify_otp">("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playStyle, setPlayStyle] = useState("All-Court Player");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Brevo OTP Verification states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(0);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    setDevOtpHint(null);

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

      if (!otpRes.sentViaBrevo && otpRes.devOtpPreview) {
        setDevOtpHint(otpRes.devOtpPreview);
      }

      setFeedback({
        type: "success",
        text: otpRes.message,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Could not send verification OTP. Please try again.",
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

    // Registration Step 1 -> Send OTP via Brevo
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
        text: "Invalid 6-digit OTP code. Please check and try again.",
      });
      return;
    }

    // OTP Verified -> Create Member Account (+500 TK)
    const res = registerMember(name, email, password, playStyle, avatarUrl);
    if (res.success) {
      setStep("form");
      setGeneratedOtp(null);
      setDevOtpHint(null);
      setName("");
      setEmail("");
      setPassword("");
      setAvatarUrl(undefined);
      setFeedback({ type: "success", text: res.message });
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
            Register (+500 TK)
          </button>
        </div>

        <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
          {mode === "login"
            ? "Sign In"
            : step === "verify_otp"
            ? "Verify Email (Brevo OTP)"
            : "Create Member Account"}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {mode === "login"
            ? "Sign in with your registered email and password."
            : step === "verify_otp"
            ? `Enter the 6-digit verification code sent to ${email}.`
            : "Verify your email via OTP to receive your 500 TK welcome balance."}
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
            {feedback.type === "success" && step === "form" && (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-1.5 inline-flex items-center gap-1 font-bold text-emerald-700 underline"
              >
                Go to Home <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Brevo 6-Digit OTP Verification View */}
        {mode === "register" && step === "verify_otp" ? (
          <form onSubmit={handleVerifyOtpSubmit} className="mt-4 space-y-4">
            {devOtpHint && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
                  Pre-Deployment Test OTP:{" "}
                  <span className="font-mono text-sm font-extrabold tracking-widest text-emerald-800">
                    {devOtpHint}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  Once <code className="font-mono">BREVO_API_KEY</code> is added
                  at deployment, this code is sent directly to the user&apos;s
                  email inbox via Brevo.
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                6-Digit Verification OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
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
              className="w-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              <MailCheck className="h-4 w-4" />
              Verify OTP & Claim 500 TK
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
                disabled={sendingOtp}
                onClick={triggerSendOtp}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-600"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 ${sendingOtp ? "animate-spin" : ""}`}
                />
                Resend OTP
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
                  onPhotoChange={(url) => setAvatarUrl(url)}
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
                  : "Send Verification OTP (500 TK)"
                : "Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
