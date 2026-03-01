"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

const trendingCreators = ["@fitnessjenna", "@chloecooks", "@alexlifts", "@skincarebymia"];

async function pollForResults(requestId: string, maxAttempts = 60): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000)); // poll every 3s

    const res = await fetch(`/api/enrich/${requestId}`);
    if (!res.ok) throw new Error("Polling failed");

    const data = await res.json();
    if (data.status === "complete") return data;
    // still pending — keep polling
  }
  throw new Error("Enrichment timed out — Clay may still be processing. Try again.");
}

export default function CreatorInput({ defaultHandle }: { defaultHandle?: string }) {
  const [handle, setHandle] = useState(defaultHandle ?? "");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusText("");

    const cleaned = handle.trim().replace(/^@/, "");
    if (!cleaned) {
      setError("We couldn't find that handle — double check and try again.");
      return;
    }

    setLoading(true);
    setStatusText("Finding your brand matches...");

    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: cleaned }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Enrichment failed");
      }

      let data = await res.json();

      // If async, poll for results
      if (data.status === "pending" && data.requestId) {
        setStatusText("Analyzing your profile — this may take a moment...");
        data = await pollForResults(data.requestId);
      }

      // Clear stale summary/strategy from previous scans
      sessionStorage.removeItem("tokker_summary");
      sessionStorage.removeItem("tokker_summary_handle");
      sessionStorage.removeItem("tokker_strategy");
      sessionStorage.setItem("tokker_enrichment", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-lg text-muted">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="your_tiktok_handle"
            className="w-full rounded-2xl border border-white/[0.08] bg-surface-1 py-4 pl-10 pr-14 text-base text-white placeholder-subtle outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !handle.trim()}
            className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand/90 active:scale-95 disabled:opacity-30 disabled:hover:bg-brand"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-brand"
        >
          {error}
        </motion.p>
      )}

      {statusText && (
        <p className="text-center text-sm text-muted">{statusText}</p>
      )}

      <p className="text-center text-xs text-subtle">
        or paste a TikTok profile link
      </p>

      {/* Trending creators */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted">Trending on Tokker</p>
        <div className="flex flex-wrap justify-center gap-2">
          {trendingCreators.map((creator) => (
            <button
              key={creator}
              type="button"
              onClick={() => setHandle(creator)}
              className="rounded-full border border-white/[0.06] bg-surface-1 px-3 py-1.5 text-xs text-white/70 transition hover:border-brand/30 hover:text-white"
            >
              {creator}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
