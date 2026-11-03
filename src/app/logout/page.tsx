"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClub } from "@/context/ClubContext";

export default function LogoutPage() {
  const { logout } = useClub();
  const router = useRouter();

  useEffect(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <p className="text-xs font-semibold text-slate-500">Signing out of ShuttlePulse...</p>
    </div>
  );
}
