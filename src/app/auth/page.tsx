"use client";

import React, { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-8 text-center text-xs text-slate-400">
          Loading ShuttlePulse Auth...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
