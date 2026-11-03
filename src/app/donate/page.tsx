"use client";

import React, { useState } from "react";
import { useClub } from "@/context/ClubContext";
import ModalSheet from "@/components/ModalSheet";
import UserAvatar from "@/components/UserAvatar";
import { Donation, User } from "@/types";
import { Plus, Pencil, Trash2, ChevronRight, Heart } from "lucide-react";

export default function DonatePage() {
  const {
    currentUser,
    users,
    donations,
    addManualDonation,
    updateManualDonation,
    deleteManualDonation,
  } = useClub();

  const isAdmin = currentUser?.role === "admin";
  const playerMembers = users.filter((u) => u.role === "member");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [inspectedMember, setInspectedMember] = useState<User | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState(
    playerMembers[0]?.id || ""
  );
  const [amount, setAmount] = useState<number>(100);
  const [purpose, setPurpose] = useState("Shuttlecock & Court Fund");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const openAddModal = (preselectedMemberId?: string) => {
    if (!isAdmin) return;
    setEditingDonation(null);
    setSelectedMemberId(preselectedMemberId || playerMembers[0]?.id || "");
    setAmount(100);
    setPurpose("Shuttlecock & Court Fund");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const openEditModal = (don: Donation) => {
    if (!isAdmin) return;
    setEditingDonation(don);
    setSelectedMemberId(don.memberId);
    setAmount(don.amount);
    setPurpose(don.purpose);
    setNote(don.note || "");
    setDate(don.date);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (editingDonation) {
      const res = updateManualDonation(
        editingDonation.id,
        selectedMemberId,
        Number(amount),
        purpose,
        note,
        date
      );
      if (res.success) {
        setFeedback(res.message);
        setModalOpen(false);
      }
    } else {
      const res = addManualDonation(
        selectedMemberId,
        Number(amount),
        purpose,
        note,
        date
      );
      if (res.success) {
        setFeedback(res.message);
        setModalOpen(false);
      }
    }
  };

  const handleDelete = () => {
    if (!isAdmin || !editingDonation) return;
    const res = deleteManualDonation(editingDonation.id);
    setFeedback(res.message);
    setModalOpen(false);
  };

  const memberDonationSummaries = playerMembers
    .map((m) => {
      const myDonations = donations.filter((d) => d.memberId === m.id);
      const total = myDonations.reduce((s, d) => s + d.amount, 0);
      return {
        member: m,
        donations: myDonations,
        total,
        count: myDonations.length,
      };
    })
    .sort((a, b) => b.total - a.total);

  const grandTotal = donations.reduce((acc, d) => acc + d.amount, 0);

  const inspectedMemberDonations = inspectedMember
    ? donations.filter((d) => d.memberId === inspectedMember.id)
    : [];
  const inspectedMemberTotal = inspectedMemberDonations.reduce(
    (s, d) => s + d.amount,
    0
  );

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 pt-4 pb-10 space-y-4">
      {/* Clean Single-Line Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
            Club Donations
          </h1>
          <p className="text-xs text-slate-500 truncate">
            Public member contributions & history
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => openAddModal()}
            disabled={playerMembers.length === 0}
            className="btn-interactive btn-shine shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Donation
          </button>
        )}
      </div>

      {/* 3D Perspective Total Community Fund Card */}
      <div className="card-3d-stage">
        <div className="card-3d-pass hero-card-shimmer relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-900 p-5 text-white flex items-center justify-between gap-3">
          <div className="animate-orb-slow pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-lime-400/20 blur-2xl" />
          <div className="animate-orb-reverse pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-teal-300/15 blur-2xl" />
          <div className="relative z-10 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 whitespace-nowrap">
              <Heart className="h-3 w-3 text-lime-300 shrink-0" />
              Total Community Fund
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-white">
                {grandTotal.toFixed(2)}
              </span>
              <span className="rounded-md bg-lime-400/20 border border-lime-300/30 px-1.5 py-0.5 font-mono text-xs font-extrabold text-lime-300">
                TK
              </span>
            </div>
          </div>
          <span className="relative z-10 shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {donations.length} entries
          </span>
        </div>
      </div>

      {feedback && (
        <div className="animate-fade-up rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Sleek Single-Line Member-Wise Donation List */}
      {memberDonationSummaries.length > 0 ? (
        <div className="rounded-2xl border border-emerald-950/5 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-emerald-950/[0.02] px-4 py-2.5">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Member Contributions
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              Tap any member for full dates & notes
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {memberDonationSummaries.map((item) => {
              const latestDate = item.donations[0]?.date.slice(5);
              return (
                <div
                  key={item.member.id}
                  onClick={() => setInspectedMember(item.member)}
                  className="cursor-pointer px-4 py-3 flex items-center justify-between gap-3 transition hover:bg-emerald-50/35"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserAvatar
                      name={item.member.name}
                      avatarUrl={item.member.avatarUrl}
                      avatarColor={item.member.avatarColor}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.member.name}
                        </p>
                        <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {item.count}x
                        </span>
                      </div>

                      {item.donations.length > 0 ? (
                        <div className="mt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          {item.donations.map((d, idx) => (
                            <span
                              key={d.id}
                              className="shrink-0 whitespace-nowrap inline-flex items-center rounded-md border border-emerald-200/70 bg-emerald-50/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800"
                            >
                              #{idx + 1}: {d.amount.toFixed(2)} TK
                            </span>
                          ))}
                          {latestDate && (
                            <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">
                              • Last {latestDate}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                          No donations recorded yet
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right whitespace-nowrap">
                      <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-700 block">
                        {item.total.toFixed(2)} TK
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Total
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        title={`Add another donation for ${item.member.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddModal(item.member.id);
                        }}
                        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white active:scale-90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    )}

                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            No registered members yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Once club members register, Admin can record and manage their
            donations here.
          </p>
        </div>
      )}

      {/* Modal 1: Member's Individual Donations Breakdown */}
      <ModalSheet
        open={Boolean(inspectedMember)}
        onClose={() => setInspectedMember(null)}
        title={inspectedMember?.name || "Member Donations"}
        subtitle="Donation History"
      >
        {inspectedMember && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/80 border border-emerald-100 px-3.5 py-2.5">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Total Contributed ({inspectedMemberDonations.length} entries)
                </span>
                <span className="font-mono text-lg font-extrabold text-emerald-700">
                  {inspectedMemberTotal.toFixed(2)} TK
                </span>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const id = inspectedMember.id;
                    setInspectedMember(null);
                    openAddModal(id);
                  }}
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </button>
              )}
            </div>

            <div className="space-y-2">
              {inspectedMemberDonations.length > 0 ? (
                inspectedMemberDonations.map((don, index) => (
                  <div
                    key={don.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          Donation #{index + 1}
                        </span>
                        <span className="text-slate-400">• {don.date}</span>
                      </div>
                      <p className="mt-0.5 text-slate-600 font-medium truncate">
                        {don.purpose}
                      </p>
                      {don.note && (
                        <p className="mt-0.5 text-slate-400 italic truncate">
                          &ldquo;{don.note}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="whitespace-nowrap rounded-lg bg-emerald-100/80 px-2 py-1 font-mono font-bold text-emerald-800">
                        +{don.amount.toFixed(2)} TK
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedMember(null);
                            openEditModal(don);
                          }}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">
                  No donations recorded for this member yet.
                </p>
              )}
            </div>
          </div>
        )}
      </ModalSheet>

      {/* ADMIN-ONLY Modal 2: Add or Update Donation */}
      <ModalSheet
        open={isAdmin && modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDonation ? "Update Donation" : "Add Member Donation"}
        subtitle="Admin Fund Manager"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            >
              {playerMembers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Amount (TK)
                </label>
                <div className="flex gap-1">
                  {[100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        amount === preset
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={10}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
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

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Purpose
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            {editingDonation && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              {editingDonation ? "Save Changes" : `Add ${amount} TK Donation`}
            </button>
          </div>
        </form>
      </ModalSheet>
    </div>
  );
}
