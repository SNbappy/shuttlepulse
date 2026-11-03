"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClub } from "@/context/ClubContext";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, hydrated, logout } = useClub();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute =
    pathname === "/auth" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/logout";

  useEffect(() => {
    if (!hydrated) return;

    // Handle /logout route: log out and redirect to /login
    if (pathname === "/logout") {
      logout();
      router.replace("/login");
      return;
    }

    // 1. Logged-out user: can ONLY visit /auth, /login, or /register
    if (!currentUser) {
      if (!isAuthRoute) {
        router.replace("/login");
      }
      return;
    }

    // 2. Logged-in user: CANNOT visit /auth, /login, or /register
    if (currentUser && isAuthRoute) {
      router.replace("/");
    }
  }, [hydrated, currentUser, pathname, isAuthRoute, router, logout]);

  // Loading state while restoring session from localStorage / Supabase
  if (!hydrated) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-800 shadow-md ring-1 ring-emerald-950/10 animate-pulse">
          <svg
            viewBox="0 0 512 512"
            fill="none"
            className="h-9 w-9"
            aria-hidden="true"
          >
            <path
              d="M232 164H154C130.8 164 112 182.8 112 206V210C112 233.2 130.8 252 154 252H198C221.2 252 240 270.8 240 294V298C240 321.2 221.2 340 198 340H114"
              stroke="#ffffff"
              strokeWidth="44"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M292 340V164H358C386.7 164 410 187.3 410 216C410 244.7 386.7 268 358 268H292"
              stroke="#a3e635"
              strokeWidth="44"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="394" cy="340" r="22" fill="#a3e635" />
          </svg>
        </div>
        <p className="mt-3 font-mono text-xs font-semibold text-emerald-800">
          ShuttlePulse
        </p>
      </div>
    );
  }

  // Prevent flicker during redirects
  if (!currentUser && !isAuthRoute) {
    return null;
  }
  if (currentUser && isAuthRoute && pathname !== "/logout") {
    return null;
  }

  return <>{children}</>;
}
