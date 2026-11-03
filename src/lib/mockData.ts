import {
  User,
  Session,
  WeeklyRating,
  Donation,
  TokenTransaction,
  RankedPlayer,
  SurveyQuestion,
  CalendarWeekMeta,
} from "@/types";

const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_FULL_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Returns the real current Year, Month (1-12), MonthKey ("YYYY-MM"),
 * and current Week of Month (1-4) based on the user's system clock.
 *
 * Official Club Week Rules (Every Month, Every Year):
 *  - Week 1 (W1): Day 01 – Day 07
 *  - Week 2 (W2): Day 08 – Day 14
 *  - Week 3 (W3): Day 15 – Day 21
 *  - Week 4 (W4): Day 22 – End of Month (28/29/30/31)
 */
export function getCurrentCalendarPeriod(now: Date = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1..12
  const day = now.getDate();

  let weekNumber: 1 | 2 | 3 | 4 = 1;
  if (day <= 7) weekNumber = 1;
  else if (day <= 14) weekNumber = 2;
  else if (day <= 21) weekNumber = 3;
  else weekNumber = 4;

  const monthStr = String(month).padStart(2, "0");
  const monthKey = `${year}-${monthStr}`;
  const weekKey = `${monthKey}-W${weekNumber}`;

  return {
    year,
    month,
    day,
    weekNumber,
    monthKey,
    weekKey,
  };
}

/**
 * Formats a "YYYY-MM" string into a human-readable label like "November 2026"
 */
export function formatMonthKeyLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr) || new Date().getFullYear();
  const monthIdx = Math.max(0, Math.min(11, (Number(mStr) || 1) - 1));
  return `${MONTH_FULL_NAMES[monthIdx]} ${year}`;
}

/**
 * Steps a "YYYY-MM" monthKey backward or forward by `deltaMonths` (-1 or +1)
 * so the app works seamlessly across any year (2025, 2026, 2027, 2030...).
 */
export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr) || new Date().getFullYear();
  const monthIdx = (Number(mStr) || 1) - 1;
  const date = new Date(year, monthIdx + deltaMonths, 1);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextY}-${nextM}`;
}

/**
 * Generates the 4 official club weeks for any "YYYY-MM" monthKey in any year.
 */
export function getWeeksForMonth(monthKey: string): CalendarWeekMeta[] {
  const [yStr, mStr] = monthKey.split("-");
  const year = Number(yStr) || new Date().getFullYear();
  const month = Number(mStr) || 1; // 1..12
  const monthIdx = Math.max(0, Math.min(11, month - 1));
  const shortMonth = MONTH_SHORT_NAMES[monthIdx];

  // Last day of this specific month & year (handles 28, 29 leap year, 30, 31)
  const lastDay = new Date(year, month, 0).getDate();
  const normalizedMonthKey = `${year}-${String(month).padStart(2, "0")}`;

  const ranges: Array<{ wk: 1 | 2 | 3 | 4; start: string; end: string }> = [
    { wk: 1, start: "01", end: "07" },
    { wk: 2, start: "08", end: "14" },
    { wk: 3, start: "15", end: "21" },
    { wk: 4, start: "22", end: String(lastDay).padStart(2, "0") },
  ];

  return ranges.map((r) => {
    const key = `${normalizedMonthKey}-W${r.wk}`;
    const dateRangeLabel = `${shortMonth} ${r.start} – ${shortMonth} ${r.end}`;
    return {
      key,
      monthKey: normalizedMonthKey,
      weekNumber: r.wk,
      shortLabel: `Week ${r.wk}`,
      dateRangeLabel,
      fullLabel: `Week ${r.wk} (${dateRangeLabel}, ${year})`,
    };
  });
}

/**
 * 25 Official Club Authority Survey Questions
 * (Editable anytime by the Club Admin / Authority in the Survey UI)
 */
export const INITIAL_SURVEY_QUESTIONS: SurveyQuestion[] = [
  // Category 1: Gameplay & Strokes (Q1 - Q5)
  { id: "q-1", number: 1, category: "Gameplay & Strokes", text: "How was his overall stroke consistency and racket control?" },
  { id: "q-2", number: 2, category: "Gameplay & Strokes", text: "How effective and accurate was his overhead smash power?" },
  { id: "q-3", number: 3, category: "Gameplay & Strokes", text: "How deep and accurate were his forehand and backhand clears?" },
  { id: "q-4", number: 4, category: "Gameplay & Strokes", text: "How deceptive and tight were his drop shots and net tumbles?" },
  { id: "q-5", number: 5, category: "Gameplay & Strokes", text: "How reliable and varied were his low and flick serves?" },

  // Category 2: Stamina & Physical Conditioning (Q6 - Q10)
  { id: "q-6", number: 6, category: "Stamina & Endurance", text: "How was his overall stamina throughout the session?" },
  { id: "q-7", number: 7, category: "Stamina & Endurance", text: "How well did he maintain energy during long 20+ shot rallies?" },
  { id: "q-8", number: 8, category: "Stamina & Endurance", text: "How fast was his breathing and physical recovery between points?" },
  { id: "q-9", number: 9, category: "Stamina & Endurance", text: "How well did his shot quality hold up in the 3rd / final set?" },
  { id: "q-10", number: 10, category: "Stamina & Endurance", text: "How was his explosive jump and lunge endurance late in games?" },

  // Category 3: Footwork & Defense (Q11 - Q15)
  { id: "q-11", number: 11, category: "Footwork & Defense", text: "How quick was his split-step and first-step court reaction?" },
  { id: "q-12", number: 12, category: "Footwork & Defense", text: "How smoothly did he recover to base position after each shot?" },
  { id: "q-13", number: 13, category: "Footwork & Defense", text: "How solid was his smash defense (blocks, lifts, and counter-drives)?" },
  { id: "q-14", number: 14, category: "Footwork & Defense", text: "How well did he cover rear-court corners under pressure?" },
  { id: "q-15", number: 15, category: "Footwork & Defense", text: "How balanced was his body posture during low retrievals?" },

  // Category 4: Tactics & Court IQ (Q16 - Q20)
  { id: "q-16", number: 16, category: "Tactics & Court IQ", text: "How smart was his shot selection in attacking vs. defensive phases?" },
  { id: "q-17", number: 17, category: "Tactics & Court IQ", text: "How well did he rotate with his partner in doubles (front/back & side/side)?" },
  { id: "q-18", number: 18, category: "Tactics & Court IQ", text: "How effectively did he target open spaces and opponent weaknesses?" },
  { id: "q-19", number: 19, category: "Tactics & Court IQ", text: "How well did he control the pace and tempo of the rally?" },
  { id: "q-20", number: 20, category: "Tactics & Court IQ", text: "How composed was he during clutch deuce / match-point situations?" },

  // Category 5: Sportsmanship & Club Spirit (Q21 - Q25)
  { id: "q-21", number: 21, category: "Sportsmanship & Spirit", text: "How fair and honest was he with line calls and shuttle touches?" },
  { id: "q-22", number: 22, category: "Sportsmanship & Spirit", text: "How supportive and communicative was he with his court partner?" },
  { id: "q-23", number: 23, category: "Sportsmanship & Spirit", text: "How respectful was his attitude toward opponents and club rules?" },
  { id: "q-24", number: 24, category: "Sportsmanship & Spirit", text: "How punctual and ready was he when called onto the court?" },
  { id: "q-25", number: 25, category: "Sportsmanship & Spirit", text: "How positively did he contribute to the overall club atmosphere?" },
];

/**
 * Clean Production Slate: Only the official Club Admin account exists by default.
 * Admin is strictly for managing the club and is NOT a playing member.
 */
export const INITIAL_USERS: User[] = [
  {
    id: "admin-1",
    name: "Admin",
    email: "admin@shuttlepulse.com",
    password: "Admin@123",
    role: "admin",
    tokens: 0,
    avatarColor: "from-emerald-700 to-teal-800",
    joinedAt: "2026-11-01",
    playStyle: "Club Management",
  },
];

export const INITIAL_SESSIONS: Session[] = [];
export const INITIAL_RATINGS: WeeklyRating[] = [];
export const INITIAL_DONATIONS: Donation[] = [];
export const INITIAL_TRANSACTIONS: TokenTransaction[] = [];

/**
 * Pure Bayesian Average Calculator (Weekly)
 *
 * Standard Bayesian Average Formula:
 *   W = (v / (v + m)) * R + (m / (v + m)) * C
 */
export function calculateWeeklyRankings(
  members: User[],
  ratings: WeeklyRating[],
  sessions: Session[],
  weekKey: string
): RankedPlayer[] {
  const weekRatings = ratings.filter((r) => r.weekKey === weekKey);
  if (weekRatings.length === 0) {
    // Before starting giving any rank, the rank list will not start
    return [];
  }

  const playerMembers = members.filter((u) => u.role === "member");

  const C =
    weekRatings.reduce((acc, r) => acc + r.overallScore, 0) /
    weekRatings.length;
  const m = 2; // Minimum confidence vote threshold

  const unranked = playerMembers
    .map((member) => {
      const myRatings = weekRatings.filter(
        (r) => r.targetMemberId === member.id
      );
      const v = myRatings.length;
      if (v === 0) return null; // Do not rank unrated players before they receive peer ratings

      const avgGameplay =
        v > 0 ? myRatings.reduce((s, r) => s + r.scores.gameplay, 0) / v : 0;
      const avgStamina =
        v > 0 ? myRatings.reduce((s, r) => s + r.scores.stamina, 0) / v : 0;
      const avgTactics =
        v > 0 ? myRatings.reduce((s, r) => s + r.scores.tactics, 0) / v : 0;
      const avgSportsmanship =
        v > 0
          ? myRatings.reduce((s, r) => s + r.scores.sportsmanship, 0) / v
          : 0;

      const R =
        v > 0 ? myRatings.reduce((s, r) => s + r.overallScore, 0) / v : 0;

      const W = v > 0 ? (v / (v + m)) * R + (m / (v + m)) * C : 0;

      const totalSessions = sessions.length;
      const attended = sessions.filter((s) =>
        s.records.some(
          (rec) => rec.memberId === member.id && rec.status === "present"
        )
      ).length;
      const attendanceRate =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100;

      return {
        memberId: member.id,
        name: member.name,
        email: member.email,
        avatarColor: member.avatarColor,
        avatarUrl: member.avatarUrl,
        playStyle: member.playStyle,
        tokens: member.tokens,
        rank: 0,
        tied: false,
        avgGameplay: Number(avgGameplay.toFixed(2)),
        avgStamina: Number(avgStamina.toFixed(2)),
        avgTactics: Number(avgTactics.toFixed(2)),
        avgSportsmanship: Number(avgSportsmanship.toFixed(2)),
        rawAverage: Number(R.toFixed(2)),
        bayesianOut10: Number(W.toFixed(2)),
        bayesianScore: Number((W * 10).toFixed(2)),
        votesReceived: v,
        attendanceRate,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (unranked.length === 0) {
    return [];
  }

  unranked.sort((a, b) => {
    if (b.bayesianScore !== a.bayesianScore) {
      return b.bayesianScore - a.bayesianScore;
    }
    return b.rawAverage - a.rawAverage;
  });

  for (let i = 0; i < unranked.length; i++) {
    if (i > 0 && unranked[i].bayesianScore === unranked[i - 1].bayesianScore) {
      unranked[i].rank = unranked[i - 1].rank;
      unranked[i].tied = true;
      unranked[i - 1].tied = true;
    } else {
      unranked[i].rank = i + 1;
    }
  }

  return unranked;
}

/**
 * Pure Bayesian Average Monthly Ranking (Based on the 4 Weeks of any Month & Year)
 */
export function calculateMonthlyRankings(
  members: User[],
  ratings: WeeklyRating[],
  sessions: Session[],
  weekKeys: string[]
): RankedPlayer[] {
  const allMonthRatings = ratings.filter((r) => weekKeys.includes(r.weekKey));
  if (allMonthRatings.length === 0) {
    // Before starting giving any rank, the monthly rank list will not start
    return [];
  }

  const playerMembers = members.filter((u) => u.role === "member");

  const weeklyMaps: Record<string, Record<string, RankedPlayer>> = {};
  weekKeys.forEach((wk) => {
    const wkRanks = calculateWeeklyRankings(members, ratings, sessions, wk);
    weeklyMaps[wk] = {};
    wkRanks.forEach((p) => {
      weeklyMaps[wk][p.memberId] = p;
    });
  });

  const C_month =
    allMonthRatings.reduce((acc, r) => acc + r.overallScore, 0) /
    allMonthRatings.length;
  const m_month = 4; // Monthly prior confidence weight across 4 weeks

  const monthlyList = playerMembers
    .map((member) => {
      let activeWeeks = 0;
      let totalGameplay = 0;
      let totalStamina = 0;
      let totalTactics = 0;
      let totalSportsmanship = 0;

      const weeklyBreakdown: {
        [weekKey: string]: {
          score: number;
          bayesianOut10: number;
          rank: number;
          votes: number;
        };
      } = {};

      weekKeys.forEach((wk) => {
        const p = weeklyMaps[wk]?.[member.id];
        if (p) {
          weeklyBreakdown[wk] = {
            score: p.bayesianScore,
            bayesianOut10: p.bayesianOut10,
            rank: p.rank,
            votes: p.votesReceived,
          };
          if (p.votesReceived > 0) {
            activeWeeks++;
            totalGameplay += p.avgGameplay;
            totalStamina += p.avgStamina;
            totalTactics += p.avgTactics;
            totalSportsmanship += p.avgSportsmanship;
          }
        }
      });

      const myMonthRatings = allMonthRatings.filter(
        (r) => r.targetMemberId === member.id
      );
      const v = myMonthRatings.length;
      if (v === 0) return null; // Do not rank unrated players before they receive peer ratings

      const R =
        v > 0
          ? myMonthRatings.reduce((acc, r) => acc + r.overallScore, 0) / v
          : 0;

      const W_month =
        v > 0
          ? (v / (v + m_month)) * R + (m_month / (v + m_month)) * C_month
          : 0;

      const totalSessions = sessions.length;
      const attended = sessions.filter((s) =>
        s.records.some(
          (rec) => rec.memberId === member.id && rec.status === "present"
        )
      ).length;
      const attendanceRate =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100;

      return {
        memberId: member.id,
        name: member.name,
        email: member.email,
        avatarColor: member.avatarColor,
        avatarUrl: member.avatarUrl,
        playStyle: member.playStyle,
        tokens: member.tokens,
        rank: 0,
        tied: false,
        avgGameplay:
          activeWeeks > 0
            ? Number((totalGameplay / activeWeeks).toFixed(2))
            : 0,
        avgStamina:
          activeWeeks > 0
            ? Number((totalStamina / activeWeeks).toFixed(2))
            : 0,
        avgTactics:
          activeWeeks > 0
            ? Number((totalTactics / activeWeeks).toFixed(2))
            : 0,
        avgSportsmanship:
          activeWeeks > 0
            ? Number((totalSportsmanship / activeWeeks).toFixed(2))
            : 0,
        rawAverage: Number(R.toFixed(2)),
        bayesianOut10: Number(W_month.toFixed(2)),
        bayesianScore: Number((W_month * 10).toFixed(2)),
        votesReceived: v,
        attendanceRate,
        weeklyBreakdown,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (monthlyList.length === 0) {
    return [];
  }

  monthlyList.sort((a, b) => {
    if (b.bayesianScore !== a.bayesianScore) {
      return b.bayesianScore - a.bayesianScore;
    }
    return b.rawAverage - a.rawAverage;
  });

  for (let i = 0; i < monthlyList.length; i++) {
    if (
      i > 0 &&
      monthlyList[i].bayesianScore === monthlyList[i - 1].bayesianScore
    ) {
      monthlyList[i].rank = monthlyList[i - 1].rank;
      monthlyList[i].tied = true;
      monthlyList[i - 1].tied = true;
    } else {
      monthlyList[i].rank = i + 1;
    }
  }

  return monthlyList;
}
