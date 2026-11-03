"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClub } from "@/context/ClubContext";
import UserAvatar from "@/components/UserAvatar";
import {
  Home,
  CalendarCheck,
  SlidersHorizontal,
  BarChart3,
  Heart,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useClub();

  const [navLoadingHref, setNavLoadingHref] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Clear route transition progress bar & close dropdown when route changes
  useEffect(() => {
    setNavLoadingHref(null);
    setMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/ratings", label: "Survey", icon: SlidersHorizontal },
    { href: "/rankings", label: "Rankings", icon: BarChart3 },
    { href: "/donate", label: "Fund", icon: Heart },
  ];

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setNavLoadingHref(href);
    }
  };

  return (
    <>
      {/* Single Sleek Top Route Transition Progress Bar */}
      {navLoadingHref && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-emerald-100">
          <div className="h-full w-2/3 animate-pulse rounded-r-full bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-400" />
        </div>
      )}

      {/* Translucent Glass Top Header */}
      <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            onClick={() => handleNavClick("/")}
            className="flex items-center gap-2.5 group shrink-0"
          >
            {/* Custom Geometric SP Monogram Logo */}
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-800 shadow-sm ring-1 ring-emerald-950/10 transition-transform duration-200 group-hover:scale-105">
              <svg
                viewBox="0 0 512 512"
                fill="none"
                className="h-6 w-6 sm:h-7 sm:w-7"
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
            <div className="whitespace-nowrap">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 block leading-none">
                Shuttle<span className="text-emerald-600">Pulse</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 block mt-0.5 leading-none">
                Badminton Club
              </span>
            </div>
          </Link>

          {/* Desktop Pill Navigation (Only visible for authenticated users) */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/70 p-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: Profile Pill with Dropdown (View Profile & Sign Out) */}
          <div ref={dropdownRef} className="relative flex items-center gap-2 shrink-0">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`btn-interactive flex items-center gap-1.5 whitespace-nowrap rounded-full border pl-3 pr-2 py-1 text-xs ${
                    menuOpen || pathname === "/profile"
                      ? "border-emerald-500 bg-emerald-100/90"
                      : "border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-100/70"
                  }`}
                >
                  {currentUser.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Admin
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-emerald-800">
                      {currentUser.tokens.toFixed(2)} TK
                    </span>
                  )}
                  <UserAvatar
                    name={currentUser.name}
                    avatarUrl={currentUser.avatarUrl}
                    avatarColor={currentUser.avatarColor}
                    size="xs"
                  />
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-emerald-700 transition-transform duration-200 ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Popover Menu */}
                {menuOpen && (
                  <div className="animate-fade-up absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl z-50">
                    <div className="border-b border-slate-100 px-3 py-2 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => {
                        setMenuOpen(false);
                        handleNavClick("/profile");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      View Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        router.push("/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-3.5 w-3.5 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => handleNavClick("/login")}
                className="btn-interactive btn-shine whitespace-nowrap rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating Glass Mobile Bottom Navigation Dock (Authenticated users only) */}
      {currentUser && (
        <div className="fixed bottom-3 left-0 right-0 z-40 px-3 md:hidden pointer-events-none">
          <nav
            aria-label="Bottom Navigation"
            className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-[0_12px_32px_-8px_rgba(6,78,59,0.16)] backdrop-blur-md"
          >
            <div className="grid grid-cols-5 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all active:scale-90 ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 stroke-[2]" />
                    <span className="mt-0.5 text-[10px] font-semibold whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
