"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useClub } from "@/context/ClubContext";
import ModalSheet from "@/components/ModalSheet";
import UserAvatar from "@/components/UserAvatar";
import {
  getCurrentCalendarPeriod,
  getWeeksForMonth,
  formatMonthKeyLabel,
  calculateMonthlyRankings,
} from "@/lib/mockData";
import {
  CalendarCheck,
  SlidersHorizontal,
  BarChart3,
  Heart,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  const { currentUser, users, sessions, ratings, donations, transactions } =
    useClub();

  const [activeModal, setActiveModal] = useState<"members" | "ledger" | null>(
    null
  );

  const playerMembers = users.filter((u) => u.role === "member");
  const currentPeriod = getCurrentCalendarPeriod();
  const currentMonthWeeks = getWeeksForMonth(currentPeriod.monthKey);

  const monthlyRanks = calculateMonthlyRankings(
    users,
    ratings,
    sessions,
    currentMonthWeeks.map((w) => w.key)
  );

  const totalDonated = donations.reduce((acc, d) => acc + d.amount, 0);
  const latestSession = sessions[0];
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 pt-4 pb-8 space-y-4">
      {/* 3D Perspective Emerald Court Pass Card */}
      <div className="card-3d-stage">
        <div className="card-3d-pass hero-card-shimmer rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-900 p-4 sm:p-6 text-white">
          {/* Animated Floating Ambient Court Orbs */}
          <div className="animate-orb-slow pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-lime-400/20 blur-2xl" />
          <div className="animate-orb-reverse pointer-events-none absolute -bottom-14 left-8 h-40 w-40 rounded-full bg-teal-300/15 blur-2xl" />

          {/* Subtle 3D Isometric Badminton Court Lines Watermark */}
          <svg
            viewBox="0 0 240 140"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-32 w-48 opacity-[0.07] rotate-[-12deg]"
          >
            <rect
              x="10"
              y="10"
              width="220"
              height="120"
              rx="4"
              stroke="white"
              strokeWidth="3"
            />
            <line
              x1="120"
              y1="10"
              x2="120"
              y2="130"
              stroke="white"
              strokeWidth="3"
              strokeDasharray="5 5"
            />
            <line
              x1="75"
              y1="10"
              x2="75"
              y2="130"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="165"
              y1="10"
              x2="165"
              y2="130"
              stroke="white"
              strokeWidth="2"
            />
            <line
              x1="10"
              y1="70"
              x2="230"
              y2="70"
              stroke="white"
              strokeWidth="2"
            />
          </svg>

          {/* ZONE 1: Card Top Row (Pass Badge on Left, Compact Identity Chip on Right) */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-300/30 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
              </span>
              {isAdmin ? (
                <>
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  Club Admin Pass
                </>
              ) : (
                <>
                  <Wallet className="h-3 w-3 shrink-0" />
                  Player Token Pass
                </>
              )}
            </span>

            {currentUser ? (
              <Link
                href="/profile"
                className="btn-interactive inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 pl-2.5 pr-1 py-0.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/30 max-w-[155px] sm:max-w-[210px]"
              >
                <span className="truncate">{currentUser.name}</span>
                <UserAvatar
                  name={currentUser.name}
                  avatarUrl={currentUser.avatarUrl}
                  avatarColor={currentUser.avatarColor}
                  size="xs"
                />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="btn-interactive btn-shine shrink-0 whitespace-nowrap rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/25"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* ZONE 2: Middle 3D Embossed Focal Metric (Full Width — Never Crowded on Mobile) */}
          <div className="relative z-10 my-4 sm:my-5">
            {isAdmin ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2.5 backdrop-blur-sm">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-200/80 whitespace-nowrap">
                    Members
                  </span>
                  <span className="mt-0.5 block font-mono text-xl sm:text-2xl font-extrabold text-white">
                    {playerMembers.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2.5 backdrop-blur-sm">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-200/80 whitespace-nowrap">
                    Sessions
                  </span>
                  <span className="mt-0.5 block font-mono text-xl sm:text-2xl font-extrabold text-lime-300">
                    {sessions.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-2.5 backdrop-blur-sm">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-200/80 whitespace-nowrap">
                    Club Fund
                  </span>
                  <span className="mt-0.5 block font-mono text-xl sm:text-2xl font-extrabold text-white whitespace-nowrap">
                    {totalDonated}{" "}
                    <span className="text-[11px] font-bold text-lime-300">
                      TK
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="block text-[11px] font-medium text-emerald-100/80">
                  Available Shuttle Token Balance
                </span>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                    {currentUser ? currentUser.tokens : 500}
                  </span>
                  <span className="rounded-md bg-lime-400/20 border border-lime-300/30 px-2 py-0.5 font-mono text-xs font-extrabold text-lime-300">
                    TK
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ZONE 3: Bottom Recessed 3D Glass Action Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-black/20 px-3 py-2.5 text-xs backdrop-blur-md">
            <span className="text-emerald-100/90 truncate">
              {latestSession ? (
                <>
                  Last split:{" "}
                  <strong className="font-mono font-bold text-lime-300">
                    -{latestSession.costPerMember} TK
                  </strong>
                </>
              ) : (
                <>No session split yet</>
              )}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal("members")}
                className="btn-interactive whitespace-nowrap rounded-xl bg-white/10 border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Balances
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("ledger")}
                className="btn-interactive btn-shine whitespace-nowrap rounded-xl bg-lime-400 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-sm hover:bg-lime-300"
              >
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staggered 2x2 Quick Navigation Grid with Icon Micro-Interactions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/attendance"
          className="stagger-1 btn-interactive group flex flex-col justify-between rounded-2xl border border-emerald-950/5 bg-white p-3.5 shadow-sm hover:border-emerald-200/80 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-emerald-600" />
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Attendance
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Sheet & PDF
            </p>
          </div>
        </Link>

        <Link
          href="/ratings"
          className="stagger-2 btn-interactive group flex flex-col justify-between rounded-2xl border border-emerald-950/5 bg-white p-3.5 shadow-sm hover:border-sky-200/80 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-sky-600" />
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Weekly Survey
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              25 questions
            </p>
          </div>
        </Link>

        <Link
          href="/rankings"
          className="stagger-3 btn-interactive group flex flex-col justify-between rounded-2xl border border-emerald-950/5 bg-white p-3.5 shadow-sm hover:border-amber-200/80 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <BarChart3 className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-amber-600" />
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Rankings
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Leaderboard
            </p>
          </div>
        </Link>

        <Link
          href="/donate"
          className="stagger-4 btn-interactive group flex flex-col justify-between rounded-2xl border border-emerald-950/5 bg-white p-3.5 shadow-sm hover:border-rose-200/80 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <Heart className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-rose-600" />
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Donations
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {totalDonated} TK fund
            </p>
          </div>
        </Link>
      </div>

      {/* Top 3 Standings Preview Card */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Top Ranked — {formatMonthKeyLabel(currentPeriod.monthKey)}
            </h2>
          </div>
          <Link
            href="/rankings"
            className="group inline-flex items-center gap-1 shrink-0 whitespace-nowrap text-xs font-semibold text-emerald-700 hover:text-emerald-600"
          >
            Full rankings
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {monthlyRanks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {monthlyRanks.slice(0, 3).map((player) => (
              <div
                key={player.memberId}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                      player.rank === 1
                        ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-sm"
                        : player.rank === 2
                        ? "bg-slate-200 text-slate-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    #{player.rank}
                  </span>
                  <UserAvatar
                    name={player.name}
                    avatarUrl={player.avatarUrl}
                    avatarColor={player.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {player.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {player.playStyle}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-lg bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
                  {player.bayesianOut10} / 10
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center">
            <p className="text-xs font-semibold text-slate-600">
              No registered club members yet
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Members can register from the Sign In page (+500 TK welcome
              balance).
            </p>
          </div>
        )}
      </div>

      {/* Modal 1: All Member Balances */}
      <ModalSheet
        open={activeModal === "members"}
        onClose={() => setActiveModal(null)}
        title="Member Token Balances"
        subtitle="500 TK Welcome Base"
      >
        {playerMembers.length > 0 ? (
          <div className="space-y-2">
            {playerMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    name={m.name}
                    avatarUrl={m.avatarUrl}
                    avatarColor={m.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap font-mono text-xs font-bold text-emerald-700">
                  {m.tokens} TK
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-slate-400">
            No playing members registered yet.
          </p>
        )}
      </ModalSheet>

      {/* Modal 2: Recent Token Activity Ledger */}
      <ModalSheet
        open={activeModal === "ledger"}
        onClose={() => setActiveModal(null)}
        title="Token Activity"
        subtitle="Session Deductions & Grants"
      >
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {tx.amount >= 0 ? (
                    <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {tx.memberName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {tx.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap font-mono font-bold ${
                    tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} TK
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-slate-400">
            No token transactions recorded yet.
          </p>
        )}
      </ModalSheet>
    </div>
  );
}
