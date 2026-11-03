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
} from "@/lib/mockData";
import { SurveyQuestion } from "@/types";
import {
  Check,
  Settings,
  ChevronRight,
  ChevronLeft,
  Info,
  Lock,
  AlertTriangle,
} from "lucide-react";

const CATEGORIES = [
  { label: "Gameplay", range: [1, 5] },
  { label: "Stamina", range: [6, 10] },
  { label: "Defense", range: [11, 15] },
  { label: "Tactics", range: [16, 20] },
  { label: "Spirit", range: [21, 25] },
];

export default function WeeklyRatingsPage() {
  const {
    currentUser,
    users,
    ratings,
    surveyQuestions,
    submitWeeklyRating,
    updateSurveyQuestions,
  } = useClub();

  const isAdmin = currentUser?.role === "admin";
  const currentPeriod = getCurrentCalendarPeriod();

  const [selectedMonthKey, setSelectedMonthKey] = useState(
    currentPeriod.monthKey
  );
  const weeksInMonth = getWeeksForMonth(selectedMonthKey);
  const [selectedWeekKey, setSelectedWeekKey] = useState(currentPeriod.weekKey);

  // Keep selectedWeekKey synced when user switches month/year
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

  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const playerMembers = users.filter((u) => u.role === "member");
  const rateableMembers = playerMembers.filter(
    (m) => m.id !== currentUser?.id
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [questionScores, setQuestionScores] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      for (let i = 1; i <= 25; i++) init[`q-${i}`] = 8;
      return init;
    }
  );

  const [editableQuestions, setEditableQuestions] =
    useState<SurveyQuestion[]>(surveyQuestions);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setEditableQuestions(surveyQuestions);
  }, [surveyQuestions]);

  const openRateModal = (memberId: string) => {
    setFeedback(null);
    if (isAdmin) {
      setFeedback({
        type: "error",
        text: "Admin account is for club management only. Playing members submit weekly peer surveys.",
      });
      return;
    }
    if (!currentUser) {
      setFeedback({
        type: "error",
        text: "Please sign in as a club member to submit weekly peer ratings.",
      });
      return;
    }

    const existing = ratings.find(
      (r) =>
        r.weekKey === selectedWeekKey &&
        r.raterId === currentUser.id &&
        r.targetMemberId === memberId
    );

    if (existing) {
      setFeedback({
        type: "error",
        text: `Locked: You have already submitted your rating (${existing.overallScore}/10) for this player in ${selectedWeekKey}. Submitted ratings cannot be modified.`,
      });
      return;
    }

    setSelectedMemberId(memberId);
    setActiveCategoryIdx(0);
    const init: Record<string, number> = {};
    for (let i = 1; i <= 25; i++) init[`q-${i}`] = 8;
    setQuestionScores(init);
    setComment("");
  };

  const avgRange = (start: number, end: number) => {
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i++) {
      sum += questionScores[`q-${i}`] ?? 8;
      count++;
    }
    return Number((sum / count).toFixed(1));
  };

  const all25Values = Object.values(questionScores);
  const overall25Mean = Number(
    (
      all25Values.reduce((acc, v) => acc + v, 0) /
      Math.max(1, all25Values.length)
    ).toFixed(2)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const res = submitWeeklyRating(
      selectedWeekKey,
      selectedMemberId,
      {
        gameplay: avgRange(1, 5),
        stamina: avgRange(6, 10),
        tactics: avgRange(11, 20),
        sportsmanship: avgRange(21, 25),
      },
      comment,
      questionScores
    );

    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
    setSelectedMemberId(null);
  };

  const handleSaveQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateSurveyQuestions(editableQuestions);
    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
    setEditModalOpen(false);
  };

  const targetPlayer = users.find((u) => u.id === selectedMemberId);
  const currentRange = CATEGORIES[activeCategoryIdx].range;
  const visibleQuestions = surveyQuestions.filter(
    (q) => q.number >= currentRange[0] && q.number <= currentRange[1]
  );
  const activeWeekMeta =
    weeksInMonth.find((w) => w.key === selectedWeekKey) || weeksInMonth[0];

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 pt-4 pb-10 space-y-4">
      {/* Clean Single-Line Header Row with (i) Guide Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            Weekly Survey
          </h1>
          <p className="text-xs text-slate-500 truncate">
            {activeWeekMeta.fullLabel}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="btn-interactive whitespace-nowrap inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
          >
            <Info className="h-3.5 w-3.5 text-emerald-600" />
            How it Works
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="btn-interactive whitespace-nowrap inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Settings className="h-3.5 w-3.5 text-emerald-600" />
              25 Qs
            </button>
          )}
        </div>
      </div>

      {/* Multi-Year Month & Week Selector Card */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-3 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              setSelectedMonthKey((prev) => shiftMonthKey(prev, -1))
            }
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
            onClick={() =>
              setSelectedMonthKey((prev) => shiftMonthKey(prev, 1))
            }
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95"
            aria-label="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 4 Official Club Weeks inside Selected Month */}
        <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-emerald-950/5 p-1">
          {weeksInMonth.map((wk) => {
            const isSelected = selectedWeekKey === wk.key;
            return (
              <button
                key={wk.key}
                type="button"
                onClick={() => setSelectedWeekKey(wk.key)}
                className={`rounded-lg py-1.5 px-1 text-center transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="block text-xs font-bold whitespace-nowrap">
                  {wk.shortLabel}
                </span>
                <span
                  className={`block text-[9px] whitespace-nowrap ${
                    isSelected ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  {wk.dateRangeLabel.replace(/^[A-Za-z]+ /, "")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permanent Lock Warning Banner */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-900">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="leading-snug">
          <strong>Final Submission Rule:</strong> Weekly surveys are{" "}
          <span className="underline font-semibold">
            permanently locked once saved
          </span>{" "}
          and cannot be edited later. Please score all 25 questions carefully.
        </p>
      </div>

      {feedback && (
        <div
          className={`animate-fade-up rounded-2xl border px-3.5 py-2.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Clean Member Selection List */}
      {rateableMembers.length > 0 ? (
        <div className="rounded-2xl border border-emerald-950/5 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
          {rateableMembers.map((member) => {
            const existing = ratings.find(
              (r) =>
                r.weekKey === selectedWeekKey &&
                r.raterId === currentUser?.id &&
                r.targetMemberId === member.id
            );

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => openRateModal(member.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-50/40 active:bg-emerald-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    avatarColor={member.avatarColor}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {member.playStyle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {existing ? (
                    <span className="whitespace-nowrap inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                      <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                      {existing.overallScore} / 10
                    </span>
                  ) : isAdmin ? (
                    <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Member Only
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Rate
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            No other club members registered yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Once at least two playing members register in the club, they can
            rate each other every week here.
          </p>
        </div>
      )}

      {/* Modal 1: Rate Selected Player (5 Questions per Step) */}
      <ModalSheet
        open={Boolean(selectedMemberId && targetPlayer)}
        onClose={() => setSelectedMemberId(null)}
        title={`Mean Score: ${overall25Mean} / 10`}
        subtitle={
          targetPlayer
            ? `${targetPlayer.name} • ${activeWeekMeta.shortLabel}`
            : undefined
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Warning inside modal */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <strong className="font-bold">Important:</strong> Once submitted,
            this weekly rating is final and cannot be changed.
          </div>

          {/* 5 Category Step Tabs */}
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategoryIdx(idx)}
                className={`whitespace-nowrap rounded-lg py-1.5 text-[11px] font-semibold transition ${
                  activeCategoryIdx === idx
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 5 Questions for Current Category */}
          <div className="space-y-2.5">
            {visibleQuestions.map((q) => {
              const val = questionScores[q.id] ?? 8;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium text-slate-800 leading-snug">
                      <span className="font-bold text-emerald-700 mr-1.5">
                        {q.number}.
                      </span>
                      {q.text}
                    </p>
                    <span className="shrink-0 rounded-md bg-white border border-emerald-200 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700">
                      {val}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={val}
                    onChange={(e) =>
                      setQuestionScores((prev) => ({
                        ...prev,
                        [q.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              );
            })}

            {activeCategoryIdx === 4 && (
              <div className="pt-1">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Step Navigation / Submit Footer */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            {activeCategoryIdx < 4 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCategoryIdx((prev) => Math.min(4, prev + 1))
                  }
                  className="flex-1 whitespace-nowrap rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white"
                >
                  Next Section ({activeCategoryIdx + 1}/5)
                </button>
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Save Final
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="w-full whitespace-nowrap rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white"
              >
                Confirm & Lock 25-Q Rating ({overall25Mean}/10)
              </button>
            )}
          </div>
        </form>
      </ModalSheet>

      {/* Modal 2: How Weekly & Monthly Survey Works (i) Info Modal */}
      <ModalSheet
        open={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        title="How Survey & Calendar Work"
        subtitle="Multi-Year Club Rating Rules"
      >
        <div className="space-y-3.5 text-xs text-slate-600">
          <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-3">
            <p className="font-bold text-emerald-950 mb-1">
              1. Automatic Year, Month & 4-Week Cycle
            </p>
            <p className="leading-relaxed">
              Every month of every year is automatically divided into{" "}
              <strong>4 official club weeks</strong> so rankings work seamlessly
              year after year:
            </p>
            <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-emerald-900">
              <li>• Week 1 (W1): Day 01 – Day 07</li>
              <li>• Week 2 (W2): Day 08 – Day 14</li>
              <li>• Week 3 (W3): Day 15 – Day 21</li>
              <li>• Week 4 (W4): Day 22 – End of Month</li>
            </ul>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-950">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              2. Non-Updatable (Permanent Lock)
            </p>
            <p className="leading-relaxed">
              Once you submit your 25-question rating for a member in a specific
              week, it is <strong>permanently locked</strong> and{" "}
              <strong>cannot be edited or updated</strong>. Please review all 5
              sections carefully before saving.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="font-bold text-slate-900 mb-1">
              3. How Weekly & Monthly Rankings Are Calculated
            </p>
            <p className="leading-relaxed">
              Your 25 answers (1–10 scale) are averaged to produce your survey
              score (<strong>R</strong>). Weekly rankings apply the{" "}
              <strong>Bayesian Average Formula</strong> across that week&apos;s
              surveys, and Monthly rankings combine all 4 weeks (W1–W4) of the
              selected month.
            </p>
          </div>
        </div>
      </ModalSheet>

      {/* Modal 3: Club Authority 25 Questions Editor */}
      <ModalSheet
        open={isAdmin && editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="25 Survey Questions"
        subtitle="Club Authority Configuration"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveQuestions} className="space-y-3.5">
          <div className="space-y-2">
            {editableQuestions.map((q, idx) => (
              <div key={q.id} className="flex items-center gap-2">
                <span className="w-7 shrink-0 font-mono text-xs font-bold text-slate-400">
                  #{q.number}
                </span>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => {
                    const next = [...editableQuestions];
                    next[idx] = { ...q, text: e.target.value };
                    setEditableQuestions(next);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white"
          >
            Save All 25 Questions
          </button>
        </form>
      </ModalSheet>
    </div>
  );
}
