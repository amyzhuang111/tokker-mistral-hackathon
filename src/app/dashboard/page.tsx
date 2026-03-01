"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, LogOut } from "lucide-react";
import DashboardFlow from "@/components/flow/DashboardFlow";
import type { EnrichmentData } from "@/types/flow";

export default function Dashboard() {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();

  const email = user?.google?.email || user?.tiktok?.username;

  // Auth guard
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  // Data loading: only use session cache set by CreatorInput (after handle submission)
  useEffect(() => {
    if (!ready || !authenticated) return;

    const stored = sessionStorage.getItem("tokker_enrichment");
    if (stored) {
      setData(JSON.parse(stored));
      return;
    }

    // No cached data — send user to home page to enter a handle
    router.push("/");
  }, [ready, authenticated, router]);

  // Loading state
  if (!ready || !authenticated || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      {/* Header nav */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <img
              src="/tokker.png"
              alt="Tokker"
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="text-sm font-bold text-white">Tokker</span>
          </button>
          <span className="h-4 w-px bg-white/10" />
          <button
            onClick={() => {
              sessionStorage.removeItem("tokker_enrichment");
              sessionStorage.removeItem("tokker_summary");
              sessionStorage.removeItem("tokker_summary_handle");
              sessionStorage.removeItem("tokker_strategy");
              sessionStorage.removeItem("tokker_selected_brands");
              sessionStorage.removeItem("tokker_last_step");
              router.push("/");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-surface-1 px-3 py-1.5 text-xs text-muted transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            New scan
          </button>
        </div>
        <div className="flex items-center gap-2">
          {email && (
            <span className="hidden text-xs text-subtle sm:block">
              {email}
            </span>
          )}
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-1 text-muted transition hover:text-white"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DashboardFlow initialData={data} />
    </div>
  );
}
