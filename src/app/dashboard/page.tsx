"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut } from "lucide-react";
import DashboardFlow from "@/components/flow/DashboardFlow";
import type { EnrichmentData } from "@/types/flow";

export default function Dashboard() {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [enriching, setEnriching] = useState(false);
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();

  const tiktokHandle = user?.tiktok?.username;
  const email = user?.google?.email || user?.tiktok?.username;

  // Auth guard
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  // Data loading: session cache or auto-enrich
  useEffect(() => {
    if (!ready || !authenticated) return;

    const stored = sessionStorage.getItem("tokker_enrichment");
    if (stored) {
      setData(JSON.parse(stored));
      return;
    }

    if (tiktokHandle) {
      setEnriching(true);
      (async () => {
        try {
          const res = await fetch("/api/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handle: tiktokHandle }),
          });
          if (!res.ok) throw new Error("Enrichment failed");
          let enrichData = await res.json();

          if (enrichData.status === "pending" && enrichData.requestId) {
            for (let i = 0; i < 60; i++) {
              await new Promise((r) => setTimeout(r, 3000));
              const pollRes = await fetch(`/api/enrich/${enrichData.requestId}`);
              if (!pollRes.ok) throw new Error("Polling failed");
              const pollData = await pollRes.json();
              if (pollData.status === "complete") {
                enrichData = pollData;
                break;
              }
              if (i === 59) throw new Error("Enrichment timed out");
            }
          }

          sessionStorage.setItem("tokker_enrichment", JSON.stringify(enrichData));
          setData(enrichData);
        } catch {
          router.push("/");
        } finally {
          setEnriching(false);
        }
      })();
      return;
    }

    router.push("/");
  }, [ready, authenticated, tiktokHandle, router]);

  // Loading state
  if (!ready || !authenticated || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        {enriching && (
          <p className="text-sm text-muted">Finding your brand matches...</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      {/* Header nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <img
            src="/tokker.png"
            alt="Tokker"
            className="h-8 w-8 rounded-full"
          />
          <span className="text-sm font-bold text-white">Tokker</span>
        </button>
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
