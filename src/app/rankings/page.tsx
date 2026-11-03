"use client";

import React, { useState, useEffect } from "react";
import { useClub } from "@/context/ClubContext";
import ModalSheet from "@/components/ModalSheet";
import UserAvatar from "@/components/UserAvatar";
import {
  getCurrentCalendarPeriod,
  getWeeksForMonth,
  formatMonthKeyLabel,
  shiftMonthKey,
  calculateWeeklyRankings,
  calculateMonthlyRankings,
} from "@/lib/mockData";
import { RankedPlayer } from "@/types";
import { ChevronRight, ChevronLeft, Info, Lock } from "lucide-react";

export default function RankingsPage() {
  const { users, ratings, sessions } = useClub();

  const currentPeriod = getCurrentCalendarPeriod();
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");
  const [selectedMonthKey, setSelectedMonthKey] = useState(
    currentPeriod.monthKey
  );

  const weeksInMonth = getWeeksForMonth(selectedMonthKey);
  const [selectedWeekKey, setSelectedWeekKey] = useState(currentPeriod.weekKey);

  useEffect(() => {
    const wks = getWeeksForMonth(selectedMonthKey);
    if (!wks.some((w) => w.key === selectedWeekKey)) {
      if (selectedMonthKey === currentPeriod.monthKey) {
        setSelectedWeekKey(currentPeriod.weekKey);
      } else {
        setSelectedWeekKey(wks[0].key);
      }
    }
  }, [selectedMonthKey]);

  const [selectedPlayer, setSelectedPlayer] = useState<RankedPlayer | null>(
    null
  );
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);

  const weeklyRankings = calculateWeeklyRankings(
    users,
    ratings,
    sessions,
    selectedWeekKey
  );
  const monthlyRankings = calculateMonthlyRankings(
    users,
    ratings,
    sessions,
    weeksInMonth.map((w) => w.key)
  );

  const activeList = viewMode === "monthly" ? monthlyRankings : weeklyRankings;
  const activeWeekMeta =
    weeksInMonth.find((w) => w.key === selectedWeekKey) || weeksInMonth[0];

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 pt-4 pb-10 space-y-4">
      {/* Clean Single-Line Header Row with (i) How Ranking Works Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            Rankings
          </h1>
          <p className="text-xs text-slate-500 truncate">
            {viewMode === "monthly"
              ? `${formatMonthKeyLabel(selectedMonthKey)} (4-Week Combined)`
              : activeWeekMeta.fullLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormulaModalOpen(true)}
          className="btn-interactive shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
        >
          <Info className="h-3.5 w-3.5 text-emerald-600" />
          How Ranking Works
        </button>
      </div>

      {/* Multi-Year Month Navigation Bar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-950/5 bg-white p-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => setSelectedMonthKey((prev) => shiftMonthKey(prev, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95"
          aria-label="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900">
            {formatMonthKeyLabel(selectedMonthKey)}
          </span>
          {selectedMonthKey === currentPeriod.monthKey && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Current
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSelectedMonthKey((prev) => shiftMonthKey(prev, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95"
          aria-label="Next Month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Segmented Switch: Monthly vs Weekly */}
      <div className="grid grid-cols-2 rounded-2xl bg-emerald-950/5 p-1">
        <button
          type="button"
          onClick={() => setViewMode("monthly")}
          className={`whitespace-nowrap rounded-xl py-2 text-xs font-semibold transition-all ${
            viewMode === "monthly"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Monthly (4 Weeks)
        </button>
        <button
          type="button"
          onClick={() => setViewMode("weekly")}
          className={`whitespace-nowrap rounded-xl py-2 text-xs font-semibold transition-all ${
            viewMode === "weekly"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Weekly Standings
        </button>
      </div>

      {/* Week Selector if in Weekly Mode */}
      {viewMode === "weekly" && (
        <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-white border border-slate-200/80 p-1">
          {weeksInMonth.map((wk) => {
            const isSelected = selectedWeekKey === wk.key;
            return (
              <button
                key={wk.key}
                type="button"
                onClick={() => setSelectedWeekKey(wk.key)}
                className={`rounded-xl py-1.5 px-1 text-center transition ${
                  isSelected
                    ? "bg-emerald-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="block text-xs font-semibold whitespace-nowrap">
                  {wk.shortLabel}
                </span>
                <span
                  className={`block text-[9px] whitespace-nowrap ${
                    isSelected ? "text-emerald-200" : "text-slate-400"
                  }`}
                >
                  {wk.dateRangeLabel.replace(/^[A-Za-z]+ /, "")}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Leaderboard List */}
      {activeList.length > 0 ? (
        <div className="rounded-2xl border border-emerald-950/5 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
          {activeList.map((player) => (
            <button
              key={player.memberId}
              type="button"
              onClick={() => setSelectedPlayer(player)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-50/35 active:bg-emerald-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                    player.rank === 1
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-sm"
                      : player.rank === 2
                      ? "bg-slate-200 text-slate-800"
                      : player.rank === 3
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  #{player.rank}
                </span>
                <UserAvatar
                  name={player.name}
                  avatarUrl={player.avatarUrl}
                  avatarColor={player.avatarColor}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {player.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {player.playStyle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right whitespace-nowrap">
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
                    {player.bayesianOut10} / 10
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {player.votesReceived} surveys
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            No registered members to rank yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Once club members register and submit weekly 25-question surveys,
            live Bayesian rankings will appear here.
          </p>
        </div>
      )}

      {/* Modal 1: Player Detailed Breakdown */}
      <ModalSheet
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
        title={selectedPlayer?.name || "Player Stats"}
        subtitle={
          selectedPlayer
            ? `Rank #${selectedPlayer.rank} • ${formatMonthKeyLabel(
                selectedMonthKey
              )}`
            : undefined
        }
      >
        {selectedPlayer && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-emerald-950/[0.03] border border-emerald-950/5 p-3 text-center text-xs">
              <div>
                <span className="text-slate-400 block whitespace-nowrap">
                  Bayesian (W)
                </span>
                <strong className="font-mono text-sm text-emerald-700">
                  {selectedPlayer.bayesianOut10}/10
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block whitespace-nowrap">
                  Raw Mean (R)
                </span>
                <strong className="font-mono text-sm text-slate-800">
                  {selectedPlayer.rawAverage}/10
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block whitespace-nowrap">
                  Surveys (v)
                </span>
                <strong className="font-mono text-sm text-slate-800">
                  {selectedPlayer.votesReceived}
                </strong>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Category Breakdown
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Gameplay", val: selectedPlayer.avgGameplay },
                  { label: "Stamina", val: selectedPlayer.avgStamina },
                  { label: "Tactics", val: selectedPlayer.avgTactics },
                  { label: "Spirit", val: selectedPlayer.avgSportsmanship },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-600">
                        {stat.label}
                      </span>
                      <strong className="font-mono text-slate-900">
                        {stat.val} / 10
                      </strong>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, stat.val * 10)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPlayer.weeklyBreakdown && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  4-Week Breakdown ({formatMonthKeyLabel(selectedMonthKey)})
                </p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {weeksInMonth.map((wk, idx) => {
                    const wkData = selectedPlayer.weeklyBreakdown?.[wk.key];
                    return (
                      <div
                        key={wk.key}
                        className="rounded-xl border border-slate-100 bg-slate-50 py-2"
                      >
                        <span className="text-[10px] text-slate-400 block">
                          W{idx + 1}
                        </span>
                        <strong className="font-mono text-slate-900">
                          {wkData && wkData.votes > 0
                            ? wkData.bayesianOut10
                            : "—"}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalSheet>

      {/* Modal 2: Complete Guide — Bayesian Formula, Week/Month Counting & Lock Policy */}
      <ModalSheet
        open={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        title="How Rankings & Weeks Work"
        subtitle="Bayesian Formula & Calendar Guide"
      >
        <div className="space-y-3.5 text-xs text-slate-600">
          {/* Formula Box */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Bayesian Average Formula
            </span>
            <p className="font-mono text-xs font-bold text-emerald-900">
              W = (v / (v + m)) · R + (m / (v + m)) · C
            </p>
          </div>

          <ul className="space-y-1.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <li>
              <strong>R (Raw Mean)</strong>: Player&apos;s average score across
              the 25 survey questions (1–10 scale).
            </li>
            <li>
              <strong>v (Votes / Surveys)</strong>: Total peer surveys received
              in that week or month.
            </li>
            <li>
              <strong>m (Confidence Weight)</strong>: Minimum vote threshold (
              <code className="font-mono">m = 2</code> weekly,{" "}
              <code className="font-mono">m = 4</code> monthly) so a single 10/10
              vote cannot unfairly beat a consistent player with many votes.
            </li>
            <li>
              <strong>C (Club Mean)</strong>: Average score across all surveys in
              the club for that period.
            </li>
          </ul>

          {/* Calendar & Week Count Explanation */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="font-bold text-slate-900 mb-1">
              How Weeks & Months Are Counted Every Year
            </p>
            <p className="leading-relaxed mb-1.5">
              The calendar works automatically across all years (2026, 2027,
              2028+). Each calendar month has <strong>4 official weeks</strong>:
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-700">
              <span className="rounded bg-white px-2 py-1 border border-slate-200/70">
                W1: Days 01 – 07
              </span>
              <span className="rounded bg-white px-2 py-1 border border-slate-200/70">
                W2: Days 08 – 14
              </span>
              <span className="rounded bg-white px-2 py-1 border border-slate-200/70">
                W3: Days 15 – 21
              </span>
              <span className="rounded bg-white px-2 py-1 border border-slate-200/70">
                W4: Days 22 – End
              </span>
            </div>
            <p className="mt-1.5 leading-relaxed">
              <strong>Monthly Ranking</strong> combines all surveys submitted
              across W1, W2, W3, and W4 of that month.
            </p>
          </div>

          {/* Non-Updatable Lock Notice */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-950">
            <p className="font-bold flex items-center gap-1.5 mb-0.5">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              Permanent Survey Lock
            </p>
            <p className="leading-relaxed">
              Submitted weekly surveys are <strong>not updatable</strong>. Once
              saved, scores are permanently locked to keep club rankings fair and
              tamper-proof.
            </p>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
