import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-950/5 bg-white px-4 py-3 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
        <span className="text-xs font-semibold text-slate-600">
          Loading...
        </span>
      </div>
    </div>
  );
}
