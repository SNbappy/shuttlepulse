"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function ModalSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
}: ModalSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-dvh w-screen items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-sheet-up flex max-h-[85dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl pb-[env(safe-area-inset-bottom,0px)]`}
      >
        {/* Mobile Drag Pill Indicator */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-slate-200" />
        </div>

        {/* Sticky Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0 pr-3">
            {subtitle && (
              <p className="text-[11px] font-semibold text-emerald-600 truncate">
                {subtitle}
              </p>
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
