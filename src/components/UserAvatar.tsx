"use client";

import React from "react";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export default function UserAvatar({
  name,
  avatarUrl,
  avatarColor = "from-emerald-600 to-teal-700",
  size = "md",
}: UserAvatarProps) {
  const sizeClasses = {
    xs: "h-6 w-6 text-[11px] rounded-full",
    sm: "h-8 w-8 text-xs rounded-xl",
    md: "h-9 w-9 text-xs rounded-xl",
    lg: "h-14 w-14 text-base rounded-2xl",
  }[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} shrink-0 object-cover border border-emerald-200/80 bg-slate-100 shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} shrink-0 flex items-center justify-center bg-gradient-to-br ${avatarColor} font-bold text-white shadow-sm`}
    >
      {(name || "U").charAt(0).toUpperCase()}
    </div>
  );
}
