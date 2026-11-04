"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Share2, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed and running as standalone PWA
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIos(isIosDevice);

    // 3. Check session dismissal (per visit)
    const sessionDismissed = sessionStorage.getItem("sp_pwa_banner_dismissed");
    if (sessionDismissed === "true") {
      setIsDismissed(true);
    }

    // 4. Capture standard Chrome / Android PWA prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosInstructions(true);
    } else {
      // General instructions fallback
      alert(
        "To install ShuttlePulse on your phone, open your browser menu (⋮) and tap 'Add to Home screen' or 'Install app'."
      );
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for the current session so next visit it reappears
    sessionStorage.setItem("sp_pwa_banner_dismissed", "true");
  };

  // If running as installed standalone app or dismissed for this visit, don't show
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-3 text-white shadow-md animate-fade-in">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm ring-1 ring-white/20">
            <Smartphone className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-white tracking-tight truncate">
                Install ShuttlePulse App
              </span>
              <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                PWA
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-100/80 truncate">
              Add to home screen for fullscreen mobile experience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn-interactive inline-flex items-center gap-1 whitespace-nowrap rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-sm transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close install prompt"
            className="flex h-7 w-7 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition active:scale-90"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Sheet */}
      {showIosInstructions && (
        <div className="mt-2.5 rounded-xl border border-white/10 bg-black/40 p-2.5 text-[11px] text-slate-200 space-y-1.5">
          <p className="font-semibold text-white">How to install on iOS Safari:</p>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>1. Tap the Share button</span>
            <Share2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>at the bottom of Safari.</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>2. Scroll down and tap</span>
            <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
              <PlusSquare className="h-3 w-3 text-emerald-400" />
              Add to Home Screen
            </span>
          </div>
          <div className="pt-1 text-right">
            <button
              type="button"
              onClick={() => setShowIosInstructions(false)}
              className="text-[10px] font-bold text-emerald-400 hover:underline"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
