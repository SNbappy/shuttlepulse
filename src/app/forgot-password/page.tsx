"use client";

import React, { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
      }
    >
      <AuthForm initialMode="forgot_password" />
    </Suspense>
  );
}
