"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClub } from "@/context/ClubContext";
import PhotoDropzone from "@/components/PhotoDropzone";
import ModalSheet from "@/components/ModalSheet";
import { Check, KeyRound, LogOut, ShieldCheck, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, updateUserProfile, logout, imgbbApiKey } = useClub();

  const [name, setName] = useState("");
  const [playStyle, setPlayStyle] = useState("All-Court Player");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [infoMessage, setInfoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth");
    } else {
      setName(currentUser.name);
      setPlayStyle(currentUser.playStyle || "All-Court Player");
      setAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-950/5 bg-white px-4 py-3 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-600">
            Redirecting to sign in...
          </span>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);

    const res = updateUserProfile({
      name: isAdmin ? "Admin" : name,
      playStyle,
      avatarUrl: avatarUrl || null,
    });

    setInfoMessage({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (
      currentUser.password &&
      currentPassword.trim() !== currentUser.password
    ) {
      setPasswordMessage({
        type: "error",
        text: "Current password does not match.",
      });
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    const res = updateUserProfile({
      password: newPassword.trim(),
    });

    if (res.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!",
      });
    } else {
      setPasswordMessage({
        type: "error",
        text: res.message,
      });
    }
  };

  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 pt-4 pb-10 space-y-4">
      {/* Clean Single-Line Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            {isAdmin ? "Admin Profile" : "Edit Profile"}
          </h1>
          <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 active:scale-95 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>

      {/* Logout Confirmation Alert Modal */}
      <ModalSheet
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
        maxWidth="max-w-xs"
      >
        <div className="text-center space-y-3.5 py-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <LogOut className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Are you sure you want to log out?
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              You will need to sign in again to access club sessions and wallet.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
                router.push("/login");
              }}
              className="rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 active:scale-95 transition"
            >
              Yes, Log Out
            </button>
          </div>
        </div>
      </ModalSheet>

      {/* Section 1: Profile Photo (ImgBB Drag & Drop) & Basic Info */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">
            Profile Photo & Information
          </h2>
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Admin Account
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              {currentUser.tokens.toFixed(2)} TK Balance
            </span>
          )}
        </div>

        {infoMessage && (
          <div
            className={`mb-4 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
              infoMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {infoMessage.text}
          </div>
        )}

        <form onSubmit={handleSaveProfileInfo} className="space-y-4">
          {/* Drag & Drop or Browse Photo */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Profile Photo (Upload or Drag & Drop)
            </label>
            <PhotoDropzone
              name={name || currentUser.name}
              avatarUrl={avatarUrl}
              avatarColor={currentUser.avatarColor}
              apiKey={imgbbApiKey}
              onPhotoChange={(url, statusMsg) => {
                setAvatarUrl(url);
                updateUserProfile({
                  avatarUrl: url || null,
                });
                if (statusMsg) {
                  setInfoMessage({ type: "success", text: statusMsg });
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                required
                disabled={isAdmin}
                value={isAdmin ? "Admin" : name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none disabled:opacity-60"
              />
              {isAdmin && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Admin display name is fixed as &ldquo;Admin&rdquo;.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500 opacity-75"
              />
            </div>
          </div>

          {!isAdmin && (
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
            className="btn-interactive btn-shine inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            <Check className="h-3.5 w-3.5" />
            Save Profile Info & Photo
          </button>
        </form>
      </div>

      {/* Section 2: Change Password Card */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3.5">
          <KeyRound className="h-4 w-4 text-emerald-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">
            Change Password
          </h2>
        </div>

        {passwordMessage && (
          <div
            className={`mb-4 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
              passwordMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
