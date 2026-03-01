"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  LogOut,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import BrandCard, {
  type Brand,
  type BrandStrategy,
} from "@/components/BrandCard";
import MarketingRequest from "@/components/MarketingRequest";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import type { ClayCreator } from "@/lib/clay";
import type { BrandEnrichment } from "@/lib/mistral";

interface EnrichmentData {
  creator: ClayCreator;
  brands: Brand[];
}

interface PRStrategyResult {
  overallStrategy: string;
  brandStrategies: BrandStrategy[];
}

type SortMode = "all" | "best-fit" | "highest-value";

export default function Dashboard() {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [strategyResult, setStrategyResult] =
    useState<PRStrategyResult | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [showStrategy, setShowStrategy] = useState(true);
  const [hasAnimatedConfetti, setHasAnimatedConfetti] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const router = useRouter();

  function handleBrandsDiscovered(brands: BrandEnrichment[]) {
    setData((prev) => {
      if (!prev) return prev;
      // Replace brand list with Mistral-suggested brands
      const updated = { ...prev, brands: brands as Brand[] };
      sessionStorage.setItem("tokker_enrichment", JSON.stringify(updated));
      return updated;
    });
    autoSelectTop3(brands as Brand[]);
    // Clear any prior strategy since brands changed
    setStrategyResult(null);
    sessionStorage.removeItem("tokker_strategy");
  }

  function autoSelectTop3(brands: Brand[]) {
    const top = [...brands]
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3)
      .map((b) => b.domain);
    setSelectedBrands(new Set(top));
  }

  function toggleBrand(domain: string) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  function toggleAllBrands() {
    if (!data) return;
    if (selectedBrands.size === data.brands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(data.brands.map((b) => b.domain)));
    }
  }
  const { ready, authenticated, user, logout } = usePrivy();

  const tiktokHandle = user?.tiktok?.username;

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
      return;
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!ready || !authenticated) return;

    const stored = sessionStorage.getItem("tokker_enrichment");
    if (stored) {
      const parsed: EnrichmentData = JSON.parse(stored);
      setData(parsed);
      autoSelectTop3(parsed.brands);
      const storedStrategy = sessionStorage.getItem("tokker_strategy");
      if (storedStrategy) {
        setStrategyResult(JSON.parse(storedStrategy));
        setHasAnimatedConfetti(true);
      }
      return;
    }

    // Auto-enrich if we have a TikTok handle from OAuth
    if (tiktokHandle) {
      setEnriching(true);

      async function autoEnrich() {
        const res = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: tiktokHandle }),
        });

        if (!res.ok) throw new Error("Enrichment failed");
        let enrichData = await res.json();

        // Handle async Clay mode — poll until results arrive
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
        autoSelectTop3(enrichData.brands);
        setEnriching(false);
      }

      autoEnrich().catch(() => {
        setEnriching(false);
        router.push("/");
      });
      return;
    }

    // No cached data and no TikTok handle — go to home to enter handle
    router.push("/");
  }, [ready, authenticated, tiktokHandle, router]);

  async function handleMarketingRequest(request: string) {
    if (!data) return;
    const brandsToSend = data.brands.filter((b) => selectedBrands.has(b.domain));
    if (brandsToSend.length === 0) return;
    setAgentLoading(true);
    setAgentError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: data.creator,
          brands: brandsToSend,
          marketingRequest: request,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Something went wrong on our end");
      }

      const result: PRStrategyResult = await res.json();
      setStrategyResult(result);
      sessionStorage.setItem("tokker_strategy", JSON.stringify(result));

      // Celebration confetti
      if (!hasAnimatedConfetti) {
        setHasAnimatedConfetti(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FE2C55", "#25F4EE", "#00DC82", "#FFB800"],
        });
      }
    } catch (err) {
      setAgentError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setAgentLoading(false);
    }
  }

  // Sort/filter brands
  const strategyMap = useMemo(() => {
    const map = new Map<string, BrandStrategy>();
    if (strategyResult) {
      for (const s of strategyResult.brandStrategies) {
        map.set(s.brandDomain, s);
      }
    }
    return map;
  }, [strategyResult]);

  const sortedBrands = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.brands];
    if (sortMode === "best-fit") {
      sorted.sort((a, b) => b.fitScore - a.fitScore);
    } else if (sortMode === "highest-value") {
      // Sort by whether strategy exists and estimated value
      sorted.sort((a, b) => {
        const aStrat = strategyMap.get(a.domain);
        const bStrat = strategyMap.get(b.domain);
        if (aStrat && !bStrat) return -1;
        if (!aStrat && bStrat) return 1;
        return b.fitScore - a.fitScore;
      });
    }
    return sorted;
  }, [data, sortMode, strategyMap]);

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

  const { creator } = data;
  const email = user?.google?.email || user?.tiktok?.username;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      {/* Header nav */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-1 text-muted transition hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
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

      {/* Rich creator profile card */}
      <div className="mb-6">
        <CreatorProfileCard creator={creator} onBrandsDiscovered={handleBrandsDiscovered} />
      </div>

      {/* Brand cards header with filter tabs + select all */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white">
            {sortedBrands.length} brand
            {sortedBrands.length !== 1 && "s"} found
          </h2>
          <button
            onClick={toggleAllBrands}
            className="flex items-center gap-1.5 text-xs text-muted transition hover:text-white"
          >
            {selectedBrands.size === data.brands.length ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            {selectedBrands.size === data.brands.length
              ? "Deselect all"
              : "Select all"}
          </button>
        </div>
        <div className="flex gap-1 rounded-xl bg-surface-1 p-1">
          {(
            [
              ["all", "All"],
              ["best-fit", "Best fit"],
              ["highest-value", "Top value"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sortMode === mode
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand cards grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {sortedBrands.map((brand, i) => (
          <BrandCard
            key={brand.domain}
            brand={brand}
            strategy={strategyMap.get(brand.domain)}
            index={i}
            selected={selectedBrands.has(brand.domain)}
            onToggle={() => toggleBrand(brand.domain)}
          />
        ))}
      </div>

      {/* Empty state for no brands */}
      {sortedBrands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-white">
            No matches yet
          </p>
          <p className="mt-1 text-sm text-muted">
            Try a different niche or check back soon — we&apos;re always adding
            new brands.
          </p>
        </div>
      )}

      {/* Marketing request */}
      <div className="mb-6 rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
        {selectedBrands.size === 0 ? (
          <p className="py-2 text-center text-sm text-muted">
            Select brands above, then describe your campaign
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted">
              Writing pitches for{" "}
              <span className="font-semibold text-brand">
                {selectedBrands.size} of {data.brands.length}
              </span>{" "}
              brand{selectedBrands.size !== 1 && "s"}
            </p>
            <MarketingRequest
              onSubmit={handleMarketingRequest}
              loading={agentLoading}
            />
          </>
        )}
        {agentError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 rounded-xl bg-brand/10 p-3"
          >
            <p className="flex-1 text-sm text-brand">{agentError}</p>
            <button
              onClick={() => setAgentError(null)}
              className="text-brand/60 hover:text-brand"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Overall strategy banner */}
      <AnimatePresence>
        {strategyResult && showStrategy && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-2xl border border-success/20 bg-success/5 p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-success" />
                <h2 className="text-sm font-bold text-success">
                  Your game plan
                </h2>
              </div>
              <button
                onClick={() => setShowStrategy(false)}
                className="text-success/40 transition hover:text-success"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
              {strategyResult.overallStrategy}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed strategy toggle */}
      {strategyResult && !showStrategy && (
        <button
          onClick={() => setShowStrategy(true)}
          className="mb-6 flex items-center gap-2 text-xs text-success transition hover:text-success/80"
        >
          <Sparkles className="h-3 w-3" />
          Show your game plan
          <ChevronDown className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
