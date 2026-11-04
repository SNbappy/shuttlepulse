"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  Session,
  WeeklyRating,
  Donation,
  TokenTransaction,
  AttendanceRecord,
  SurveyScores,
  SurveyQuestion,
} from "@/types";
import {
  INITIAL_USERS,
  INITIAL_SESSIONS,
  INITIAL_RATINGS,
  INITIAL_DONATIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_SURVEY_QUESTIONS,
  getWeeksForMonth,
} from "@/lib/mockData";
import {
  isSupabaseConfigured,
  supabaseSelect,
  supabaseUpsert,
  supabaseDeleteById,
} from "@/lib/supabase";

interface ClubContextType {
  currentUser: User | null;
  hydrated: boolean;
  users: User[];
  sessions: Session[];
  ratings: WeeklyRating[];
  donations: Donation[];
  transactions: TokenTransaction[];
  surveyQuestions: SurveyQuestion[];
  imgbbApiKey: string;
  setImgbbApiKey: (key: string) => void;
  brevoApiKey: string;
  setBrevoApiKey: (key: string) => void;
  supabaseConnected: boolean;
  login: (
    email: string,
    password?: string
  ) => { success: boolean; message: string };
  logout: () => void;
  registerMember: (
    name: string,
    email: string,
    password: string,
    playStyle?: string,
    avatarUrl?: string
  ) => { success: boolean; message: string };
  resetPasswordByEmail: (
    email: string,
    newPassword: string
  ) => { success: boolean; message: string };
  updateUserProfile: (updates: {
    name?: string;
    playStyle?: string;
    password?: string;
    avatarUrl?: string;
  }) => { success: boolean; message: string };
  recordAttendanceSession: (
    title: string,
    date: string,
    shuttleCost: number,
    records: AttendanceRecord[]
  ) => { success: boolean; message: string };
  updateAttendanceSession: (
    sessionId: string,
    shuttleCost: number,
    records: AttendanceRecord[]
  ) => { success: boolean; message: string };
  toggleSingleAttendanceBox: (
    sessionId: string,
    memberId: string
  ) => { success: boolean; message: string };
  submitWeeklyRating: (
    weekKey: string,
    targetMemberId: string,
    scores: SurveyScores,
    comment?: string,
    questionScores?: Record<string, number>
  ) => { success: boolean; message: string };
  updateSurveyQuestions: (
    updatedQuestions: SurveyQuestion[]
  ) => { success: boolean; message: string };
  addManualDonation: (
    memberId: string,
    amount: number,
    purpose: string,
    note?: string,
    date?: string
  ) => { success: boolean; message: string };
  updateManualDonation: (
    donationId: string,
    memberId: string,
    amount: number,
    purpose: string,
    note?: string,
    date?: string
  ) => { success: boolean; message: string };
  deleteManualDonation: (
    donationId: string
  ) => { success: boolean; message: string };
  topUpMemberTokens: (
    memberId: string,
    amount: number,
    reason?: string
  ) => { success: boolean; message: string };
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: "sp_users_prod_v1",
  CURRENT_USER_ID: "sp_current_user_id_prod_v1",
  SESSIONS: "sp_sessions_prod_v1",
  RATINGS: "sp_ratings_prod_v1",
  DONATIONS: "sp_donations_prod_v1",
  TRANSACTIONS: "sp_transactions_prod_v1",
  QUESTIONS: "sp_survey_questions_prod_v1",
  IMGBB_KEY: "sp_imgbb_api_key_v1",
  BREVO_KEY: "sp_brevo_api_key_v1",
};

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-purple-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-lime-500 to-green-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-teal-600",
];

// Row mappers between TypeScript camelCase and Supabase PostgreSQL snake_case
function mapUserToDb(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password || "",
    role: u.role,
    tokens: u.tokens,
    avatar_color: u.avatarColor,
    avatar_url: u.avatarUrl || null,
    joined_at: u.joinedAt,
    play_style: u.playStyle || null,
  };
}

function mapUserFromDb(r: Record<string, unknown>): User {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    password: r.password ? String(r.password) : undefined,
    role: r.role === "admin" ? "admin" : "member",
    tokens: Number(r.tokens ?? 0),
    avatarColor: String(r.avatar_color || "from-emerald-500 to-teal-600"),
    avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
    joinedAt: String(r.joined_at || ""),
    playStyle: r.play_style ? String(r.play_style) : undefined,
  };
}

function mapSessionToDb(s: Session) {
  return {
    id: s.id,
    date: s.date,
    title: s.title,
    shuttle_cost: s.shuttleCost,
    present_count: s.presentCount,
    cost_per_member: s.costPerMember,
    records: s.records,
    created_at: s.createdAt,
  };
}

function mapSessionFromDb(r: Record<string, unknown>): Session {
  return {
    id: String(r.id),
    date: String(r.date),
    title: String(r.title),
    shuttleCost: Number(r.shuttle_cost ?? 0),
    presentCount: Number(r.present_count ?? 0),
    costPerMember: Number(r.cost_per_member ?? 0),
    records: Array.isArray(r.records) ? (r.records as AttendanceRecord[]) : [],
    createdAt: String(r.created_at || ""),
  };
}

function mapRatingToDb(rt: WeeklyRating) {
  return {
    id: rt.id,
    week_key: rt.weekKey,
    week_label: rt.weekLabel,
    month_key: rt.monthKey,
    rater_id: rt.raterId,
    target_member_id: rt.targetMemberId,
    question_scores: rt.questionScores || {},
    scores: rt.scores,
    overall_score: rt.overallScore,
    comment: rt.comment || null,
    created_at: rt.createdAt,
  };
}

function mapRatingFromDb(r: Record<string, unknown>): WeeklyRating {
  return {
    id: String(r.id),
    weekKey: String(r.week_key),
    weekLabel: String(r.week_label),
    monthKey: String(r.month_key),
    raterId: String(r.rater_id),
    targetMemberId: String(r.target_member_id),
    questionScores: (r.question_scores as Record<string, number>) || undefined,
    scores: (r.scores as SurveyScores) || {
      gameplay: 8,
      stamina: 8,
      tactics: 8,
      sportsmanship: 8,
    },
    overallScore: Number(r.overall_score ?? 0),
    comment: r.comment ? String(r.comment) : undefined,
    createdAt: String(r.created_at || ""),
  };
}

function mapDonationToDb(d: Donation) {
  return {
    id: d.id,
    member_id: d.memberId,
    member_name: d.memberName,
    member_email: d.memberEmail,
    avatar_color: d.avatarColor,
    avatar_url: d.avatarUrl || null,
    amount: d.amount,
    purpose: d.purpose,
    note: d.note || null,
    date: d.date,
    added_by_admin: d.addedByAdmin,
  };
}

function mapDonationFromDb(r: Record<string, unknown>): Donation {
  return {
    id: String(r.id),
    memberId: String(r.member_id),
    memberName: String(r.member_name),
    memberEmail: String(r.member_email),
    avatarColor: String(r.avatar_color || "from-emerald-500 to-teal-600"),
    avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
    amount: Number(r.amount ?? 0),
    purpose: String(r.purpose || ""),
    note: r.note ? String(r.note) : undefined,
    date: String(r.date || ""),
    addedByAdmin: String(r.added_by_admin || "Admin"),
  };
}

function mapTxToDb(tx: TokenTransaction) {
  return {
    id: tx.id,
    member_id: tx.memberId,
    member_name: tx.memberName,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
    date: tx.date,
  };
}

function mapTxFromDb(r: Record<string, unknown>): TokenTransaction {
  return {
    id: String(r.id),
    memberId: String(r.member_id),
    memberName: String(r.member_name),
    amount: Number(r.amount ?? 0),
    type: (r.type as TokenTransaction["type"]) || "shuttle_deduction",
    description: String(r.description || ""),
    date: String(r.date || ""),
  };
}

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [ratings, setRatings] = useState<WeeklyRating[]>(INITIAL_RATINGS);
  const [donations, setDonations] = useState<Donation[]>(INITIAL_DONATIONS);
  const [transactions, setTransactions] =
    useState<TokenTransaction[]>(INITIAL_TRANSACTIONS);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>(
    INITIAL_SURVEY_QUESTIONS
  );
  const [imgbbApiKey, setImgbbApiKeyState] = useState<string>(
    process.env.NEXT_PUBLIC_IMGBB_API_KEY || ""
  );
  const [brevoApiKey, setBrevoApiKeyState] = useState<string>(
    process.env.NEXT_PUBLIC_BREVO_API_KEY || ""
  );
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 1. Load from localStorage & sync from Supabase if configured
  useEffect(() => {
    async function initStore() {
      try {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        const savedCurrentId = localStorage.getItem(
          STORAGE_KEYS.CURRENT_USER_ID
        );
        const isAuthenticated = localStorage.getItem("sp_auth_authenticated") === "true";
        const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        const savedRatings = localStorage.getItem(STORAGE_KEYS.RATINGS);
        const savedDonations = localStorage.getItem(STORAGE_KEYS.DONATIONS);
        const savedTransactions = localStorage.getItem(
          STORAGE_KEYS.TRANSACTIONS
        );
        const savedQuestions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
        const savedImgbb = localStorage.getItem(STORAGE_KEYS.IMGBB_KEY);
        const savedBrevo = localStorage.getItem(STORAGE_KEYS.BREVO_KEY);

        if (savedUsers) {
          const parsed: User[] = JSON.parse(savedUsers);
          const hasAdmin = parsed.some((u) => u.role === "admin");
          if (!hasAdmin) {
            parsed.unshift(INITIAL_USERS[0]);
          } else {
            parsed.forEach((u) => {
              if (u.role === "admin") u.name = "Admin";
            });
          }
          setUsers(parsed);
        }
        if (savedCurrentId !== null && savedCurrentId !== "null") {
          // If admin-1 was previously set by default without explicit login, clear it
          if (savedCurrentId === "admin-1" && !isAuthenticated) {
            setCurrentUserId(null);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, "null");
          } else {
            setCurrentUserId(savedCurrentId);
          }
        } else {
          setCurrentUserId(null);
        }
        if (savedSessions) setSessions(JSON.parse(savedSessions));
        if (savedRatings) setRatings(JSON.parse(savedRatings));
        if (savedDonations) setDonations(JSON.parse(savedDonations));
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
        if (savedQuestions) setSurveyQuestions(JSON.parse(savedQuestions));
        if (savedImgbb) setImgbbApiKeyState(savedImgbb);
        if (savedBrevo) setBrevoApiKeyState(savedBrevo);

        // Fetch live data from Supabase if NEXT_PUBLIC_SUPABASE_URL is configured
        if (isSupabaseConfigured()) {
          const [dbUsers, dbSessions, dbRatings, dbDonations, dbTx, dbQs] =
            await Promise.all([
              supabaseSelect<Record<string, unknown>>("sp_users"),
              supabaseSelect<Record<string, unknown>>(
                "sp_sessions",
                "select=*&order=created_at.desc"
              ),
              supabaseSelect<Record<string, unknown>>(
                "sp_ratings",
                "select=*&order=created_at.desc"
              ),
              supabaseSelect<Record<string, unknown>>(
                "sp_donations",
                "select=*&order=date.desc"
              ),
              supabaseSelect<Record<string, unknown>>(
                "sp_transactions",
                "select=*&order=date.desc"
              ),
              supabaseSelect<SurveyQuestion>(
                "sp_questions",
                "select=*&order=number.asc"
              ),
            ]);

          if (dbUsers) {
            setSupabaseConnected(true);
            const mappedUsers = dbUsers.map(mapUserFromDb);
            if (!mappedUsers.some((u) => u.role === "admin")) {
              mappedUsers.unshift(INITIAL_USERS[0]);
              await supabaseUpsert("sp_users", mapUserToDb(INITIAL_USERS[0]));
            }
            setUsers(mappedUsers);
          }
          if (dbSessions) setSessions(dbSessions.map(mapSessionFromDb));
          if (dbRatings) setRatings(dbRatings.map(mapRatingFromDb));
          if (dbDonations) setDonations(dbDonations.map(mapDonationFromDb));
          if (dbTx) setTransactions(dbTx.map(mapTxFromDb));
          if (dbQs && dbQs.length === 25) setSurveyQuestions(dbQs);
        }
      } catch (e) {
        console.error("Failed to initialize state:", e);
      } finally {
        setHydrated(true);
      }
    }

    initStore();
  }, []);

  // Persist to localStorage for instant offline / mobile caching
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER_ID,
      currentUserId ? currentUserId : "null"
    );
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
    localStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      JSON.stringify(transactions)
    );
    localStorage.setItem(
      STORAGE_KEYS.QUESTIONS,
      JSON.stringify(surveyQuestions)
    );
    if (imgbbApiKey) {
      localStorage.setItem(STORAGE_KEYS.IMGBB_KEY, imgbbApiKey);
    }
    if (brevoApiKey) {
      localStorage.setItem(STORAGE_KEYS.BREVO_KEY, brevoApiKey);
    }
  }, [
    hydrated,
    users,
    currentUserId,
    sessions,
    ratings,
    donations,
    transactions,
    surveyQuestions,
    imgbbApiKey,
    brevoApiKey,
  ]);

  const setImgbbApiKey = (key: string) => setImgbbApiKeyState(key.trim());
  const setBrevoApiKey = (key: string) => setBrevoApiKeyState(key.trim());

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  const login = (email: string, password?: string) => {
    const normalized = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) {
      return {
        success: false,
        message: "No account found with this email address.",
      };
    }
    if (
      password !== undefined &&
      found.password &&
      found.password !== password
    ) {
      return {
        success: false,
        message: "Invalid password. Please try again.",
      };
    }
    setCurrentUserId(found.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("sp_auth_authenticated", "true");
    }
    return {
      success: true,
      message: `Signed in as ${found.name}.`,
    };
  };

  const logout = () => {
    setCurrentUserId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sp_auth_authenticated");
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, "null");
    }
  };

  const registerMember = (
    name: string,
    email: string,
    password: string,
    playStyle?: string,
    avatarUrl?: string
  ) => {
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalized)) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    const newUser: User = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      email: normalized,
      password,
      role: "member",
      tokens: 500,
      avatarColor: AVATAR_GRADIENTS[users.length % AVATAR_GRADIENTS.length],
      avatarUrl: avatarUrl || undefined,
      joinedAt: new Date().toISOString().split("T")[0],
      playStyle: playStyle?.trim() || "All-Court Player",
    };

    const initTx: TokenTransaction = {
      id: `tx-${Date.now()}`,
      memberId: newUser.id,
      memberName: newUser.name,
      amount: 500,
      type: "initial_grant",
      description: "Verified Member Registration Welcome Token (500 TK)",
      date: newUser.joinedAt,
    };

    setUsers((prev) => [...prev, newUser]);
    setTransactions((prev) => [initTx, ...prev]);
    setCurrentUserId(newUser.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("sp_auth_authenticated", "true");
    }

    // Sync to Supabase
    void supabaseUpsert("sp_users", mapUserToDb(newUser));
    void supabaseUpsert("sp_transactions", mapTxToDb(initTx));

    return {
      success: true,
      message:
        "Email verified & account created! 500 TK Shuttle Token has been credited to your wallet.",
    };
  };

  const resetPasswordByEmail = (email: string, newPassword: string) => {
    const normalized = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) {
      return {
        success: false,
        message: "No account found with this email address.",
      };
    }
    if (!newPassword || newPassword.trim().length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters.",
      };
    }

    let updatedUserObj: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== found.id) return u;
        updatedUserObj = {
          ...u,
          password: newPassword.trim(),
        };
        return updatedUserObj;
      })
    );

    if (updatedUserObj) {
      void supabaseUpsert("sp_users", mapUserToDb(updatedUserObj));
    }

    return {
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    };
  };

  const updateUserProfile = (updates: {
    name?: string;
    playStyle?: string;
    password?: string;
    avatarUrl?: string;
  }) => {
    if (!currentUser) {
      return { success: false, message: "You must be signed in." };
    }

    const nextName =
      currentUser.role === "admin"
        ? "Admin"
        : updates.name?.trim() || currentUser.name;

    let updatedUserObj: User | null = null;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        updatedUserObj = {
          ...u,
          name: nextName,
          playStyle:
            u.role === "admin"
              ? "Club Management"
              : updates.playStyle?.trim() || u.playStyle,
          password:
            updates.password && updates.password.trim().length > 0
              ? updates.password.trim()
              : u.password,
          avatarUrl:
            updates.avatarUrl !== undefined ? updates.avatarUrl : u.avatarUrl,
        };
        return updatedUserObj;
      })
    );

    if (updatedUserObj) {
      void supabaseUpsert("sp_users", mapUserToDb(updatedUserObj));
    }

    if (currentUser.role === "member") {
      setDonations((prev) =>
        prev.map((d) =>
          d.memberId === currentUser.id
            ? {
                ...d,
                memberName: nextName,
                avatarUrl:
                  updates.avatarUrl !== undefined
                    ? updates.avatarUrl
                    : d.avatarUrl,
              }
            : d
        )
      );
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.memberId === currentUser.id ? { ...tx, memberName: nextName } : tx
        )
      );
    }

    return {
      success: true,
      message: "Profile saved successfully!",
    };
  };

  const recordAttendanceSession = (
    title: string,
    date: string,
    shuttleCost: number,
    records: AttendanceRecord[]
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can record session attendance.",
      };
    }

    const presentMembers = records.filter((r) => r.status === "present");
    const presentCount = presentMembers.length;

    if (presentCount === 0) {
      return {
        success: false,
        message:
          "At least 1 member must be marked Present to split shuttle cost.",
      };
    }

    const costPerMember = Number((shuttleCost / presentCount).toFixed(2));
    const presentIds = new Set(presentMembers.map((r) => r.memberId));

    const newTransactions: TokenTransaction[] = [];
    const changedUsers: User[] = [];

    const updatedUsers = users.map((user) => {
      if (user.role === "member" && presentIds.has(user.id)) {
        newTransactions.push({
          id: `tx-${Date.now()}-${user.id}`,
          memberId: user.id,
          memberName: user.name,
          amount: -costPerMember,
          type: "shuttle_deduction",
          description: `Shuttle Split (${shuttleCost} TK ÷ ${presentCount}) — ${title}`,
          date,
        });
        const nextU = {
          ...user,
          tokens: Number((user.tokens - costPerMember).toFixed(2)),
        };
        changedUsers.push(nextU);
        return nextU;
      }
      return user;
    });

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      date,
      title: title.trim() || "Regular Session",
      shuttleCost,
      presentCount,
      costPerMember,
      records,
      createdAt: new Date().toISOString(),
    };

    setUsers(updatedUsers);
    setSessions((prev) => [newSession, ...prev]);
    setTransactions((prev) => [...newTransactions, ...prev]);

    // Sync to Supabase
    void supabaseUpsert("sp_sessions", mapSessionToDb(newSession));
    if (changedUsers.length > 0) {
      void supabaseUpsert("sp_users", changedUsers.map(mapUserToDb));
    }
    if (newTransactions.length > 0) {
      void supabaseUpsert("sp_transactions", newTransactions.map(mapTxToDb));
    }

    return {
      success: true,
      message: `Session saved! ${costPerMember} TK (${shuttleCost} TK ÷ ${presentCount} present) deducted from each present member.`,
    };
  };

  const updateAttendanceSession = (
    sessionId: string,
    newShuttleCost: number,
    newRecords: AttendanceRecord[]
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can edit attendance.",
      };
    }

    const oldSession = sessions.find((s) => s.id === sessionId);
    if (!oldSession) {
      return { success: false, message: "Session not found." };
    }

    const newPresent = newRecords.filter((r) => r.status === "present");
    const newPresentCount = newPresent.length;

    if (newPresentCount === 0) {
      return {
        success: false,
        message: "At least 1 member must remain Present in a session.",
      };
    }

    const oldCostPerMember = oldSession.costPerMember;
    const newCostPerMember = Number(
      (newShuttleCost / newPresentCount).toFixed(2)
    );

    const oldPresentIds = new Set(
      oldSession.records
        .filter((r) => r.status === "present")
        .map((r) => r.memberId)
    );
    const newPresentIds = new Set(newPresent.map((r) => r.memberId));

    const adjustmentTransactions: TokenTransaction[] = [];
    const changedUsers: User[] = [];

    const updatedUsers = users.map((user) => {
      if (user.role !== "member") return user;

      const wasPresent = oldPresentIds.has(user.id);
      const isNowPresent = newPresentIds.has(user.id);

      const oldDeduction = wasPresent ? oldCostPerMember : 0;
      const newDeduction = isNowPresent ? newCostPerMember : 0;

      const delta = Number((oldDeduction - newDeduction).toFixed(2));

      if (delta !== 0) {
        adjustmentTransactions.push({
          id: `tx-adj-${Date.now()}-${user.id}`,
          memberId: user.id,
          memberName: user.name,
          amount: delta,
          type: "shuttle_deduction",
          description: `Attendance Updated (${oldSession.date}): ${
            delta > 0 ? `Refunded +${delta} TK` : `Adjusted ${delta} TK`
          } (New split: ${newCostPerMember} TK)`,
          date: oldSession.date,
        });
      }

      const nextU = {
        ...user,
        tokens: Number((user.tokens + delta).toFixed(2)),
      };
      if (delta !== 0) changedUsers.push(nextU);
      return nextU;
    });

    const updatedSession: Session = {
      ...oldSession,
      shuttleCost: newShuttleCost,
      presentCount: newPresentCount,
      costPerMember: newCostPerMember,
      records: newRecords,
    };

    setUsers(updatedUsers);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? updatedSession : s))
    );
    if (adjustmentTransactions.length > 0) {
      setTransactions((prev) => [...adjustmentTransactions, ...prev]);
    }

    // Sync to Supabase
    void supabaseUpsert("sp_sessions", mapSessionToDb(updatedSession));
    if (changedUsers.length > 0) {
      void supabaseUpsert("sp_users", changedUsers.map(mapUserToDb));
    }
    if (adjustmentTransactions.length > 0) {
      void supabaseUpsert(
        "sp_transactions",
        adjustmentTransactions.map(mapTxToDb)
      );
    }

    return {
      success: true,
      message: `Attendance updated for ${oldSession.date}! Split recounted: ${newShuttleCost} TK ÷ ${newPresentCount} present = ${newCostPerMember} TK/member.`,
    };
  };

  const toggleSingleAttendanceBox = (sessionId: string, memberId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      return { success: false, message: "Session not found." };
    }

    const exists = targetSession.records.some((r) => r.memberId === memberId);
    let updatedRecords: AttendanceRecord[];

    if (exists) {
      updatedRecords = targetSession.records.map((r) =>
        r.memberId === memberId
          ? {
              ...r,
              status: r.status === "present" ? "absent" : "present",
            }
          : r
      );
    } else {
      updatedRecords = [
        ...targetSession.records,
        { memberId, status: "present" },
      ];
    }

    return updateAttendanceSession(
      sessionId,
      targetSession.shuttleCost,
      updatedRecords
    );
  };

  const submitWeeklyRating = (
    weekKey: string,
    targetMemberId: string,
    scores: SurveyScores,
    comment?: string,
    questionScores?: Record<string, number>
  ) => {
    if (!currentUser) {
      return {
        success: false,
        message: "You must be signed in as a member to rate fellow players.",
      };
    }
    if (currentUser.role === "admin") {
      return {
        success: false,
        message:
          "Admin is for club management only. Only playing members submit peer ratings.",
      };
    }
    if (currentUser.id === targetMemberId) {
      return {
        success: false,
        message: "You cannot rate yourself.",
      };
    }

    const alreadyExists = ratings.some(
      (r) =>
        r.weekKey === weekKey &&
        r.raterId === currentUser.id &&
        r.targetMemberId === targetMemberId
    );

    if (alreadyExists) {
      return {
        success: false,
        message:
          "This weekly rating has already been submitted and is permanently locked (cannot be updated).",
      };
    }

    const parts = weekKey.split("-W");
    const monthKey = parts[0] || "2026-11";
    const weeksInMonth = getWeeksForMonth(monthKey);
    const weekMeta =
      weeksInMonth.find((w) => w.key === weekKey) || weeksInMonth[0];

    let overallScore = 0;
    if (questionScores && Object.keys(questionScores).length > 0) {
      const vals = Object.values(questionScores);
      overallScore = Number(
        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
      );
    } else {
      overallScore = Number(
        (
          (scores.gameplay +
            scores.stamina +
            scores.tactics +
            scores.sportsmanship) /
          4
        ).toFixed(2)
      );
    }

    const newRating: WeeklyRating = {
      id: `rate-${Date.now()}`,
      weekKey,
      weekLabel: weekMeta.fullLabel,
      monthKey,
      raterId: currentUser.id,
      targetMemberId,
      questionScores,
      scores,
      overallScore,
      comment: comment?.trim(),
      createdAt: new Date().toISOString(),
    };

    setRatings((prev) => [newRating, ...prev]);
    void supabaseUpsert("sp_ratings", mapRatingToDb(newRating));

    return {
      success: true,
      message:
        "25-Question Weekly Survey permanently saved! Bayesian Average rankings updated.",
    };
  };

  const updateSurveyQuestions = (updatedQuestions: SurveyQuestion[]) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can edit the 25 survey questions.",
      };
    }
    setSurveyQuestions(updatedQuestions);
    void supabaseUpsert("sp_questions", updatedQuestions);
    return {
      success: true,
      message: "All 25 Club Authority survey questions have been saved!",
    };
  };

  const addManualDonation = (
    memberId: string,
    amount: number,
    purpose: string,
    note?: string,
    date?: string
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can record donations.",
      };
    }

    const member = users.find((u) => u.id === memberId && u.role === "member");
    if (!member) {
      return {
        success: false,
        message: "Selected member not found.",
      };
    }

    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      avatarColor: member.avatarColor,
      avatarUrl: member.avatarUrl,
      amount: Number(amount),
      purpose: purpose.trim() || "Club Development & Shuttle Fund",
      note: note?.trim(),
      date: date || new Date().toISOString().split("T")[0],
      addedByAdmin: "Admin",
    };

    setDonations((prev) => [newDonation, ...prev]);
    void supabaseUpsert("sp_donations", mapDonationToDb(newDonation));

    return {
      success: true,
      message: `Donation of ${amount} TK by ${member.name} has been recorded!`,
    };
  };

  const updateManualDonation = (
    donationId: string,
    memberId: string,
    amount: number,
    purpose: string,
    note?: string,
    date?: string
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can update donations.",
      };
    }

    const member = users.find((u) => u.id === memberId && u.role === "member");
    if (!member) {
      return {
        success: false,
        message: "Selected member not found.",
      };
    }

    let updatedDonObj: Donation | null = null;

    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        updatedDonObj = {
          ...d,
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          avatarColor: member.avatarColor,
          avatarUrl: member.avatarUrl,
          amount: Number(amount),
          purpose: purpose.trim() || "Club Development & Shuttle Fund",
          note: note?.trim(),
          date: date || d.date,
        };
        return updatedDonObj;
      })
    );

    if (updatedDonObj) {
      void supabaseUpsert("sp_donations", mapDonationToDb(updatedDonObj));
    }

    return {
      success: true,
      message: `Updated donation record for ${member.name} (${amount} TK).`,
    };
  };

  const deleteManualDonation = (donationId: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can remove donations.",
      };
    }
    setDonations((prev) => prev.filter((d) => d.id !== donationId));
    void supabaseDeleteById("sp_donations", donationId);
    return {
      success: true,
      message: "Donation entry removed.",
    };
  };

  const topUpMemberTokens = (
    memberId: string,
    amount: number,
    reason?: string
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
      return {
        success: false,
        message: "Only Admin can top up member tokens.",
      };
    }

    const member = users.find((u) => u.id === memberId && u.role === "member");
    if (!member) {
      return { success: false, message: "Member not found." };
    }

    const nextU: User = {
      ...member,
      tokens: Number((member.tokens + amount).toFixed(2)),
    };

    setUsers((prev) => prev.map((u) => (u.id === memberId ? nextU : u)));

    const tx: TokenTransaction = {
      id: `tx-topup-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      amount,
      type: "admin_topup",
      description: reason || `Admin Token Top-Up (+${amount} TK)`,
      date: new Date().toISOString().split("T")[0],
    };

    setTransactions((prev) => [tx, ...prev]);

    void supabaseUpsert("sp_users", mapUserToDb(nextU));
    void supabaseUpsert("sp_transactions", mapTxToDb(tx));

    return {
      success: true,
      message: `Added ${amount} TK tokens to ${member.name}'s wallet.`,
    };
  };

  return (
    <ClubContext.Provider
      value={{
        currentUser,
        hydrated,
        users,
        sessions,
        ratings,
        donations,
        transactions,
        surveyQuestions,
        imgbbApiKey,
        setImgbbApiKey,
        brevoApiKey,
        setBrevoApiKey,
        supabaseConnected,
        login,
        logout,
        registerMember,
        resetPasswordByEmail,
        updateUserProfile,
        recordAttendanceSession,
        updateAttendanceSession,
        toggleSingleAttendanceBox,
        submitWeeklyRating,
        updateSurveyQuestions,
        addManualDonation,
        updateManualDonation,
        deleteManualDonation,
        topUpMemberTokens,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
}
