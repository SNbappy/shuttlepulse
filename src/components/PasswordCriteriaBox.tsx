"use client";

import React from "react";
import { validatePassword } from "@/lib/passwordValidation";
import { Check, X } from "lucide-react";

interface PasswordCriteriaBoxProps {
  password: string;
  showAlways?: boolean;
}

export default function PasswordCriteriaBox({
  password,
  showAlways = false,
}: PasswordCriteriaBoxProps) {
  // Only show if user has started typing or showAlways is true
  if (!showAlways && (!password || password.length === 0)) {
    return null;
  }

  const result = validatePassword(password);

  const criteriaItems = [
    {
      label: "At least 8 characters",
      met: result.hasMinLength,
    },
    {
      label: "One uppercase letter (A-Z)",
      met: result.hasUppercase,
    },
    {
      label: "One lowercase letter (a-z)",
      met: result.hasLowercase,
    },
    {
      label: "One number (0-9)",
      met: result.hasNumber,
    },
    {
      label: "One special symbol (!@#$%^&*)",
      met: result.hasSpecialChar,
    },
  ];

  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong & Secure"];
  const strengthColors = [
    "bg-rose-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-emerald-600",
  ];
  const strengthIndex = Math.max(0, result.score - 1);

  return (
    <div className="mt-2 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 text-xs space-y-2 animate-fade-in">
      {/* Strength indicator */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-600">Password Strength:</span>
        <span
          className={`font-bold ${
            result.isValid
              ? "text-emerald-700"
              : result.score >= 3
              ? "text-amber-700"
              : "text-rose-600"
          }`}
        >
          {password ? strengthLabels[strengthIndex] : "Enter password"}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-full transition-all duration-300 ${
              result.score >= index
                ? strengthColors[strengthIndex]
                : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
        {criteriaItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              item.met
                ? "text-emerald-700 font-semibold"
                : "text-slate-500 font-normal"
            }`}
          >
            {item.met ? (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
            ) : (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-slate-500 shrink-0">
                <X className="h-2.5 w-2.5 stroke-[2.5]" />
              </span>
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
