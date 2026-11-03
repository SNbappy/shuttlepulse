"use client";

import React, { useState, useEffect } from "react";
import { useClub } from "@/context/ClubContext";
import ModalSheet from "@/components/ModalSheet";
import UserAvatar from "@/components/UserAvatar";
import { AttendanceRecord, Session } from "@/types";
import { Plus, Pencil, Check, FileDown } from "lucide-react";

export default function AttendancePage() {
  const {
    currentUser,
    users,
    sessions,
    recordAttendanceSession,
    updateAttendanceSession,
    toggleSingleAttendanceBox,
    topUpMemberTokens,
  } = useClub();

  const playerMembers = users.filter((u) => u.role === "member");
  const isAdmin = currentUser?.role === "admin";

  const [editMode, setEditMode] = useState(false);

  // Admin modal state for taking new attendance
  const [takeModalOpen, setTakeModalOpen] = useState(false);
  const [title] = useState("Regular Session");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [shuttleCost, setShuttleCost] = useState<number>(150);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, "present" | "absent">
  >({});

  // Selected session modal (for viewing or editing an existing session)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [editSessionCost, setEditSessionCost] = useState<number>(150);
  const [editSessionMap, setEditSessionMap] = useState<
    Record<string, "present" | "absent">
  >({});

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setAttendanceMap((prev) => {
      const next: Record<string, "present" | "absent"> = {};
      playerMembers.forEach((m) => {
        next[m.id] = prev[m.id] || "present";
      });
      return next;
    });
  }, [users.length]);

  const presentCount = playerMembers.filter(
    (m) => attendanceMap[m.id] === "present"
  ).length;
  const costPerMember =
    presentCount > 0 ? Number((shuttleCost / presentCount).toFixed(2)) : 0;

  const toggleNewMember = (id: string) => {
    if (!isAdmin) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  const handleSaveNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || presentCount === 0) return;

    const records: AttendanceRecord[] = playerMembers.map((m) => ({
      memberId: m.id,
      status: attendanceMap[m.id] || "absent",
    }));

    const res = recordAttendanceSession(
      title,
      date,
      Number(shuttleCost) || 0,
      records
    );
    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
    if (res.success) setTakeModalOpen(false);
  };

  const openSessionModal = (sess: Session) => {
    setSelectedSessionId(sess.id);
    setEditSessionCost(sess.shuttleCost);
    const map: Record<string, "present" | "absent"> = {};
    playerMembers.forEach((m) => {
      const found = sess.records.find((r) => r.memberId === m.id);
      map[m.id] = found ? found.status : "absent";
    });
    setEditSessionMap(map);
  };

  const handleUpdateExistingSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedSessionId) return;

    const updatedRecords: AttendanceRecord[] = playerMembers.map((m) => ({
      memberId: m.id,
      status: editSessionMap[m.id] || "absent",
    }));

    const res = updateAttendanceSession(
      selectedSessionId,
      Number(editSessionCost) || 0,
      updatedRecords
    );

    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
    if (res.success) {
      setSelectedSessionId(null);
    }
  };

  const handleCellBoxClick = (sess: Session, memberId: string) => {
    if (isAdmin && editMode) {
      const res = toggleSingleAttendanceBox(sess.id, memberId);
      setFeedback({
        type: res.success ? "success" : "error",
        text: res.message,
      });
    } else {
      openSessionModal(sess);
    }
  };

  const orderedSessions = [...sessions].reverse();
  const inspectedSession = sessions.find((s) => s.id === selectedSessionId);

  const editPresentCount = playerMembers.filter(
    (m) => editSessionMap[m.id] === "present"
  ).length;
  const editCostPerMember =
    editPresentCount > 0
      ? Number((editSessionCost / editPresentCount).toFixed(2))
      : 0;

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: orderedSessions.length > 5 ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    doc.setFillColor(6, 78, 59);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 72, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ShuttlePulse Badminton Club — Attendance Report", 40, 34);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(167, 243, 208);
    doc.text(
      `Generated on ${new Date().toISOString().split("T")[0]} • Total Sessions: ${
        orderedSessions.length
      }`,
      40,
      52
    );

    const headRow = [
      "Member Name",
      "Balance (TK)",
      ...orderedSessions.map(
        (s, idx) => `S${idx + 1}\n${s.date.slice(5)}\n(-${s.costPerMember.toFixed(2)} TK)`
      ),
      "Present Total",
    ];

    const bodyRows = playerMembers.map((member) => {
      const presentSessions = orderedSessions.filter((s) =>
        s.records.some(
          (r) => r.memberId === member.id && r.status === "present"
        )
      ).length;

      const sessionStatuses = orderedSessions.map((sess) => {
        const rec = sess.records.find((r) => r.memberId === member.id);
        return rec?.status === "present" ? "Present" : "Absent";
      });

      return [
        member.name,
        `${member.tokens.toFixed(2)} TK`,
        ...sessionStatuses,
        `${presentSessions} / ${orderedSessions.length}`,
      ];
    });

    autoTable(doc, {
      startY: 92,
      head: [headRow],
      body: bodyRows,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 7,
        valign: "middle",
      },
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { fontStyle: "bold", halign: "left" },
        1: { halign: "right" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index >= 2) {
          if (data.cell.raw === "Present") {
            data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.halign = "center";
          } else if (data.cell.raw === "Absent") {
            data.cell.styles.textColor = [148, 163, 184];
            data.cell.styles.halign = "center";
          } else {
            data.cell.styles.halign = "center";
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    doc.save("ShuttlePulse-Attendance-Report.pdf");
  };

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 pt-4 pb-10 space-y-4">
      {/* Clean Single-Line Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            Attendance Sheet
          </h1>
          <p className="text-xs text-slate-500 truncate">
            Member & session-wise attendance matrix
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          disabled={playerMembers.length === 0}
          className="btn-interactive shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-40"
        >
          <FileDown className="h-3.5 w-3.5 text-emerald-600" />
          Export PDF
        </button>
      </div>

      {/* Dedicated Single-Row Admin Toolbar */}
      {isAdmin && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-950/5 bg-white p-2.5 shadow-sm">
          <span className="pl-1.5 text-xs font-semibold text-slate-600 truncate">
            Admin Session Controls
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {orderedSessions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditMode(!editMode);
                  setFeedback(null);
                }}
                className={`btn-interactive whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                  editMode
                    ? "border-amber-300 bg-amber-50 text-amber-900 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {editMode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-amber-700" />
                    Done Editing
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                    Edit Boxes
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setTakeModalOpen(true);
              }}
              className="btn-interactive btn-shine whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Take Attendance
            </button>
          </div>
        </div>
      )}

      {isAdmin && editMode && (
        <div className="animate-fade-up rounded-2xl border border-amber-200 bg-amber-50/95 px-3.5 py-2.5 text-xs text-amber-900 shadow-sm">
          <strong>Edit Mode Active:</strong> Tap any <strong>Present</strong> or{" "}
          <strong>Absent</strong> box below to toggle it and automatically
          recount member tokens.
        </div>
      )}

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

      {/* Overall Attendance Matrix */}
      {playerMembers.length > 0 ? (
        <div className="rounded-2xl border border-emerald-950/5 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-emerald-950/[0.025] text-[11px] font-semibold text-slate-500">
                  <th className="sticky left-0 z-10 bg-[#f9fbfa] py-3 pl-4 pr-3 min-w-[155px] whitespace-nowrap">
                    Member
                  </th>
                  {orderedSessions.map((sess, idx) => {
                    const shortDate = sess.date.slice(5);
                    return (
                      <th
                        key={sess.id}
                        onClick={() => openSessionModal(sess)}
                        className="cursor-pointer py-2.5 px-2 text-center min-w-[74px] whitespace-nowrap hover:bg-emerald-50/60 transition"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] font-extrabold text-emerald-700">
                            S{idx + 1}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {shortDate}
                          </span>
                        </div>
                        <span className="block font-mono text-[10px] font-normal text-slate-400">
                          -{sess.costPerMember.toFixed(2)} TK
                        </span>
                      </th>
                    );
                  })}
                  <th className="py-3 pl-2 pr-4 text-right min-w-[58px] whitespace-nowrap">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {playerMembers.map((member) => {
                  const presentSessions = orderedSessions.filter((s) =>
                    s.records.some(
                      (r) =>
                        r.memberId === member.id && r.status === "present"
                    )
                  ).length;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-emerald-50/30 transition"
                    >
                      <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm py-3 pl-4 pr-3 border-r border-slate-100/80 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={member.name}
                            avatarUrl={member.avatarUrl}
                            avatarColor={member.avatarColor}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[115px] sm:max-w-[150px]">
                              {member.name}
                            </p>
                            <p className="text-[11px] font-mono font-semibold text-emerald-700">
                              {member.tokens.toFixed(2)} TK
                            </p>
                          </div>
                        </div>
                      </td>

                      {orderedSessions.map((sess) => {
                        const rec = sess.records.find(
                          (r) => r.memberId === member.id
                        );
                        const isPresent = rec?.status === "present";

                        return (
                          <td
                            key={sess.id}
                            onClick={() => handleCellBoxClick(sess, member.id)}
                            className="cursor-pointer py-2.5 px-1.5 text-center select-none whitespace-nowrap"
                          >
                            {isPresent ? (
                              <span
                                className={`inline-flex items-center gap-1 justify-center rounded-lg bg-emerald-50 border px-2 py-1 text-[11px] font-semibold text-emerald-800 transition-all ${
                                  isAdmin && editMode
                                    ? "border-emerald-400 ring-2 ring-emerald-500/20 hover:bg-emerald-100 active:scale-90"
                                    : "border-emerald-200/80"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                Present
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 transition-all ${
                                  isAdmin && editMode
                                    ? "border border-slate-300 ring-2 ring-slate-400/20 hover:bg-slate-200 active:scale-90"
                                    : ""
                                }`}
                              >
                                Absent
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 pl-2 pr-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                        {presentSessions}/{orderedSessions.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-500">
            <span className="truncate">
              {isAdmin
                ? "Tap S1, S2... to edit session shuttle cost or use Edit Boxes"
                : "Tap any session header (S1, S2...) for split details"}
            </span>
            <span className="shrink-0 whitespace-nowrap font-medium">
              {orderedSessions.length} sessions
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            No registered members yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Once club members register (+500 TK welcome tokens), Admin can take
            regular session attendance here.
          </p>
        </div>
      )}

      {/* Modal 1: Session Detail & Admin Session Editor */}
      <ModalSheet
        open={Boolean(inspectedSession)}
        onClose={() => setSelectedSessionId(null)}
        title={inspectedSession?.title || "Session Details"}
        subtitle={inspectedSession?.date}
      >
        {inspectedSession &&
          (isAdmin ? (
            <form
              onSubmit={handleUpdateExistingSession}
              className="space-y-3.5"
            >
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900">
                    Shuttle Cost (TK)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={editSessionCost}
                    onChange={(e) => setEditSessionCost(Number(e.target.value))}
                    className="mt-1 w-28 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 font-mono text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-500 block whitespace-nowrap">
                    Split ({editPresentCount} present)
                  </span>
                  <strong className="font-mono text-sm font-bold text-emerald-700 whitespace-nowrap">
                    -{editCostPerMember.toFixed(2)} TK / player
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                {playerMembers.map((m) => {
                  const wasPresent = inspectedSession.records.some(
                    (r) => r.memberId === m.id && r.status === "present"
                  );
                  const isNowPresent = editSessionMap[m.id] === "present";

                  const oldDeduction = wasPresent
                    ? inspectedSession.costPerMember
                    : 0;
                  const newDeduction = isNowPresent ? editCostPerMember : 0;
                  const delta = Number(
                    (oldDeduction - newDeduction).toFixed(2)
                  );
                  const projectedTokens = Number(
                    (m.tokens + delta).toFixed(2)
                  );

                  return (
                    <div
                      key={m.id}
                      onClick={() =>
                        setEditSessionMap((prev) => ({
                          ...prev,
                          [m.id]:
                            prev[m.id] === "present" ? "absent" : "present",
                        }))
                      }
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 transition select-none ${
                        isNowPresent
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-slate-100 bg-slate-50/60 opacity-70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 truncate">
                          {m.tokens.toFixed(2)} TK
                          {delta !== 0 && (
                            <span
                              className={
                                delta > 0
                                  ? "text-emerald-600 font-bold"
                                  : "text-rose-600 font-bold"
                              }
                            >
                              {" "}
                              ({delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} →{" "}
                              {projectedTokens.toFixed(2)} TK)
                            </span>
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          isNowPresent
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isNowPresent ? "Present" : "Absent"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={editPresentCount === 0}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Update Session & Recount Tokens
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  Shuttle Cost
                </span>
                <strong className="font-mono text-slate-900">
                  {inspectedSession.shuttleCost.toFixed(2)} TK
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  Present
                </span>
                <strong className="font-mono text-emerald-600">
                  {inspectedSession.presentCount} players
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  Per Player
                </span>
                <strong className="font-mono text-emerald-700">
                  -{inspectedSession.costPerMember.toFixed(2)} TK
                </strong>
              </div>
            </div>
          ))}
      </ModalSheet>

      {/* Modal 2: ADMIN-ONLY Take New Attendance & Shuttle Cost Split Interface */}
      <ModalSheet
        open={isAdmin && takeModalOpen}
        onClose={() => setTakeModalOpen(false)}
        title="Take Session Attendance"
        subtitle="Admin Session & Shuttle Split"
      >
        {playerMembers.length > 0 ? (
          <form onSubmit={handleSaveNewSession} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Shuttle Cost (TK)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={shuttleCost}
                  onChange={(e) => setShuttleCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/80 border border-emerald-100 px-3.5 py-2.5 text-xs">
              <span className="text-slate-600 whitespace-nowrap">
                <strong className="text-slate-900">{shuttleCost.toFixed(2)} TK</strong> ÷{" "}
                <strong className="text-emerald-700">
                  {presentCount} present
                </strong>
              </span>
              <span className="font-mono font-bold text-emerald-700 whitespace-nowrap">
                -{costPerMember.toFixed(2)} TK / player
              </span>
            </div>

            <div className="space-y-2">
              {playerMembers.map((member) => {
                const isPresent = attendanceMap[member.id] === "present";
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleNewMember(member.id)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 transition select-none ${
                      isPresent
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-slate-100 bg-slate-50/60 opacity-65"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        {member.tokens.toFixed(2)} TK
                        {isPresent &&
                          ` → ${(member.tokens - costPerMember).toFixed(2)} TK`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const res = topUpMemberTokens(member.id, 100);
                          setFeedback({ type: "success", text: res.message });
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                      >
                        +100
                      </button>
                      <span
                        className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          isPresent
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isPresent ? "Present" : "Absent"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={presentCount === 0}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              Save Attendance & Deduct {costPerMember.toFixed(2)} TK
            </button>
          </form>
        ) : (
          <p className="py-6 text-center text-xs text-slate-500">
            Please register at least one club member first before recording
            attendance.
          </p>
        )}
      </ModalSheet>
    </div>
  );
}
