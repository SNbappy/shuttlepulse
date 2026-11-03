export type Role = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  tokens: number; // Default 500 TK on member registration
  avatarColor: string;
  avatarUrl?: string; // Hosted on ImgBB or compressed data URL
  joinedAt: string;
  playStyle?: string;
}

export interface AttendanceRecord {
  memberId: string;
  status: "present" | "absent";
}

export interface Session {
  id: string;
  date: string;
  title: string;
  shuttleCost: number;
  presentCount: number;
  costPerMember: number;
  records: AttendanceRecord[];
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  number: number; // 1 to 25
  category: string;
  text: string;
}

export interface SurveyScores {
  gameplay: number; // Category 1 average (1 - 10)
  stamina: number; // Category 2 average (1 - 10)
  tactics: number; // Category 3 & 4 average (1 - 10)
  sportsmanship: number; // Category 5 average (1 - 10)
}

export interface WeeklyRating {
  id: string;
  weekKey: string; // e.g., "2026-11-W1"
  weekLabel: string;
  monthKey: string; // e.g., "2026-11"
  raterId: string;
  targetMemberId: string;
  questionScores?: Record<string, number>; // Scores for each of the 25 questions (q-1 to q-25)
  scores: SurveyScores; // Category summary averages
  overallScore: number; // Mean across all 25 questions (out of 10)
  comment?: string;
  createdAt: string;
}

export interface RankedPlayer {
  memberId: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarUrl?: string;
  playStyle?: string;
  tokens: number;
  rank: number; // Standard Competition Ranking ("1224")
  tied: boolean;
  avgGameplay: number;
  avgStamina: number;
  avgTactics: number;
  avgSportsmanship: number;
  rawAverage: number; // R: Player's arithmetic mean across the 25-question surveys (out of 10)
  bayesianScore: number; // W * 10
  bayesianOut10: number; // Pure Bayesian Average on 1-10 scale
  votesReceived: number; // v: Number of peer surveys received
  attendanceRate: number;
  weeklyBreakdown?: {
    [weekKey: string]: {
      score: number;
      bayesianOut10: number;
      rank: number;
      votes: number;
    };
  };
}

export interface Donation {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  avatarColor: string;
  avatarUrl?: string;
  amount: number;
  purpose: string;
  note?: string;
  date: string;
  addedByAdmin: string;
}

export interface TokenTransaction {
  id: string;
  memberId: string;
  memberName: string;
  amount: number; // negative for deduction, positive for initial/topup
  type: "initial_grant" | "shuttle_deduction" | "admin_topup";
  description: string;
  date: string;
}

export interface CalendarWeekMeta {
  key: string; // e.g., "2026-11-W1"
  monthKey: string; // e.g., "2026-11"
  weekNumber: 1 | 2 | 3 | 4;
  shortLabel: string; // "Week 1"
  dateRangeLabel: string; // "Nov 01 – Nov 07"
  fullLabel: string; // "Week 1 (Nov 01 – Nov 07, 2026)"
}
