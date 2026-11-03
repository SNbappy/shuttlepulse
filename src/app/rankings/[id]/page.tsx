"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useClub } from "@/context/ClubContext";
import UserAvatar from "@/components/UserAvatar";
import {
  ArrowLeft,
  Award,
  Users,
  Coins,
  ShieldCheck,
  Flame,
  Activity,
  Heart,
  MessageSquare,
  BarChart3,
} from "lucide-react";

export default function PlayerRankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { users, ratings, surveyQuestions, sessions } = useClub();

  const memberId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const player = users.find((u) => u.id === memberId);

  if (!player) {
    return (
      <div className="animate-fade-up mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Award className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Player Not Found</h1>
        <p className="text-xs text-slate-500">
          The player profile you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/rankings"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Rankings
        </Link>
      </div>
    );
  }

  // Get all peer survey ratings targeting this player
  const playerRatings = ratings.filter((r) => r.targetMemberId === player.id);
  const reviewsCount = playerRatings.length;
  const uniqueRatersCount = new Set(playerRatings.map((r) => r.raterId)).size;

  // Attendance metrics
  const totalSessions = sessions.length;
  const attendedCount = sessions.filter((s) =>
    s.records.some((rec) => rec.memberId === player.id && rec.status === "present")
  ).length;
  const attendanceRate = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 100;

  // Overall and category averages
  const overallAvg =
    reviewsCount > 0
      ? playerRatings.reduce((sum, r) => sum + r.overallScore, 0) / reviewsCount
      : 0;

  const gameplayAvg =
    reviewsCount > 0
      ? playerRatings.reduce((sum, r) => sum + r.scores.gameplay, 0) / reviewsCount
      : 0;
  const staminaAvg =
    reviewsCount > 0
      ? playerRatings.reduce((sum, r) => sum + r.scores.stamina, 0) / reviewsCount
      : 0;
  const tacticsAvg =
    reviewsCount > 0
      ? playerRatings.reduce((sum, r) => sum + r.scores.tactics, 0) / reviewsCount
      : 0;
  const sportsmanshipAvg =
    reviewsCount > 0
      ? playerRatings.reduce((sum, r) => sum + r.scores.sportsmanship, 0) / reviewsCount
      : 0;

  // Group the 25 questions into the 5 standard categories
  const categories = [
    {
      name: "Gameplay & Strokes",
      range: [1, 5],
      icon: Flame,
      avg: gameplayAvg,
      color: "text-amber-600",
      bg: "bg-amber-50",
      bar: "from-amber-500 to-orange-500",
    },
    {
      name: "Stamina & Physical Conditioning",
      range: [6, 10],
      icon: Activity,
      avg: staminaAvg,
      color: "text-rose-600",
      bg: "bg-rose-50",
      bar: "from-rose-500 to-pink-500",
    },
    {
      name: "Footwork & Defense",
      range: [11, 15],
      icon: ShieldCheck,
      avg: tacticsAvg,
      color: "text-blue-600",
      bg: "bg-blue-50",
      bar: "from-blue-500 to-indigo-500",
    },
    {
      name: "Tactics & Court IQ",
      range: [16, 20],
      icon: BarChart3,
      avg: tacticsAvg,
      color: "text-purple-600",
      bg: "bg-purple-50",
      bar: "from-purple-500 to-violet-500",
    },
    {
      name: "Sportsmanship & Spirit",
      range: [21, 25],
      icon: Heart,
      avg: sportsmanshipAvg,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      bar: "from-emerald-500 to-teal-500",
    },
  ];

  // Helper to compute question score average
  const getQuestionAverage = (qNum: number): number => {
    if (reviewsCount === 0) return 0;
    const scores = playerRatings.map((r) => {
      if (r.questionScores && r.questionScores[`q-${qNum}`] !== undefined) {
        return Number(r.questionScores[`q-${qNum}`]);
      }
      if (qNum <= 5) return r.scores.gameplay;
      if (qNum <= 10) return r.scores.stamina;
      if (qNum <= 20) return r.scores.tactics;
      return r.scores.sportsmanship;
    });
    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  };

  const commentsWithFeedback = playerRatings
    .filter((r) => r.comment && r.comment.trim().length > 0)
    .map((r) => ({
      comment: r.comment as string,
      weekLabel: r.weekLabel,
      createdAt: r.createdAt,
    }));

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 pt-4 pb-12 space-y-4">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/rankings")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Rankings
        </button>
      </div>

      {/* Player Profile Card */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar
              name={player.name}
              avatarUrl={player.avatarUrl}
              avatarColor={player.avatarColor}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {player.name}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {player.playStyle || "All-Court Player"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span>Member since {player.joinedAt}</span>
                <span>•</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {player.tokens.toFixed(2)} TK Balance
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                Overall Average
              </span>
              <span className="font-mono text-base font-extrabold text-emerald-800">
                {overallAvg > 0 ? `${overallAvg.toFixed(2)} / 10.00` : "No Ratings"}
              </span>
            </div>
          </div>
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <span className="text-[10px] text-slate-400 block font-medium">Peer Reviews</span>
            <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5">
            <span className="text-[10px] text-slate-400 block font-medium">Rated by Members</span>
            <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              {uniqueRatersCount} {uniqueRatersCount === 1 ? "member" : "members"}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5">
            <span className="text-[10px] text-slate-400 block font-medium">Attendance Rate</span>
            <span className="font-mono text-xs font-bold text-slate-900 mt-0.5 block">
              {attendanceRate.toFixed(2)}%
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5">
            <span className="text-[10px] text-slate-400 block font-medium">Shuttle Wallet</span>
            <span className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
              <Coins className="h-3.5 w-3.5 text-emerald-600" />
              {player.tokens.toFixed(2)} TK
            </span>
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900">Category Summaries</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.name} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${cat.color}`} />
                    {cat.name}
                  </span>
                  <strong className="font-mono text-slate-900">
                    {reviewsCount > 0 ? `${cat.avg.toFixed(2)} / 10.00` : "—"}
                  </strong>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.bar} transition-all duration-500`}
                    style={{ width: `${reviewsCount > 0 ? Math.min(100, (cat.avg / 10) * 100) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 25 Questions Breakdown */}
      <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">
            25-Question Peer Survey Breakdown
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Average marks awarded out of 10.00 by club peers for each evaluated skill.
          </p>
        </div>

        {reviewsCount === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
            <p className="text-xs font-bold text-slate-700">No Surveys Submitted Yet</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Rankings and 25-question scores will appear once peers evaluate this player in weekly surveys.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const catQuestions = surveyQuestions.filter(
                (q) => q.number >= cat.range[0] && q.number <= cat.range[1]
              );
              const Icon = cat.icon;

              return (
                <div key={cat.name} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
                      {cat.name} (Q{cat.range[0]} – Q{cat.range[1]})
                    </span>
                    <span className="font-mono text-xs font-extrabold text-slate-700">
                      Category Mean: {cat.avg.toFixed(2)} / 10.00
                    </span>
                  </div>

                  <div className="space-y-2">
                    {catQuestions.map((q) => {
                      const avgMark = getQuestionAverage(q.number);
                      const pct = Math.min(100, Math.max(0, (avgMark / 10) * 100));

                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-emerald-50/30"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="min-w-0">
                              <span className="inline-block rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 mr-2">
                                Q{String(q.number).padStart(2, "0")}
                              </span>
                              <span className="text-xs font-medium text-slate-800 leading-snug">
                                {q.text}
                              </span>
                            </div>

                            <div className="shrink-0 text-right">
                              <span className="inline-block rounded-lg bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 font-mono text-xs font-extrabold text-emerald-800">
                                {avgMark.toFixed(2)} / 10.00
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Peer Comments / Qualitative Feedback */}
      {commentsWithFeedback.length > 0 && (
        <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Peer Comments & Notes ({commentsWithFeedback.length})
            </h2>
          </div>

          <div className="space-y-2">
            {commentsWithFeedback.map((c, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs"
              >
                <p className="text-slate-800 italic">&ldquo;{c.comment}&rdquo;</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{c.weekLabel}</span>
                  <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
