"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import BrandCard, {
  type Brand,
  type BrandStrategy,
} from "@/components/BrandCard";
import MarketingRequest from "@/components/MarketingRequest";

interface CreatorProfile {
  handle: string;
  followers: string;
  niche: string;
  avgViews: string;
  topContentThemes: string[];
}

interface EnrichmentData {
  creator: CreatorProfile;
  brands: Brand[];
}

interface PRStrategyResult {
  overallStrategy: string;
  brandStrategies: BrandStrategy[];
}

export default function Dashboard() {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [strategyResult, setStrategyResult] =
    useState<PRStrategyResult | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
      return;
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("tokker_enrichment");
    if (!stored) {
      router.push("/");
      return;
    }
    setData(JSON.parse(stored));

    // Also restore strategy if it was already generated
    const storedStrategy = sessionStorage.getItem("tokker_strategy");
    if (storedStrategy) {
      setStrategyResult(JSON.parse(storedStrategy));
    }
  }, [router]);

  async function handleMarketingRequest(request: string) {
    if (!data) return;
    setAgentLoading(true);
    setAgentError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: data.creator,
          brands: data.brands,
          marketingRequest: request,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Agent request failed");
      }

      const result: PRStrategyResult = await res.json();
      setStrategyResult(result);
      sessionStorage.setItem("tokker_strategy", JSON.stringify(result));
    } catch (err) {
      setAgentError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setAgentLoading(false);
    }
  }

  if (!ready || !authenticated || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const { creator, brands } = data;

  // Map strategies by brand domain for easy lookup
  const strategyMap = new Map<string, BrandStrategy>();
  if (strategyResult) {
    for (const s of strategyResult.brandStrategies) {
      strategyMap.set(s.brandDomain, s);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/")}
            className="mb-2 text-sm text-zinc-500 transition hover:text-white"
          >
            &larr; New search
          </button>
          <h1 className="text-3xl font-bold text-white">
            Brand Matches for @{creator.handle}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user?.google?.email && (
            <span className="text-sm text-zinc-400">{user.google.email}</span>
          )}
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Creator summary */}
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-400">
          Creator Profile
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Followers</p>
            <p className="text-lg font-semibold text-white">
              {creator.followers}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Niche</p>
            <p className="text-lg font-semibold text-white">{creator.niche}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Avg Views</p>
            <p className="text-lg font-semibold text-white">
              {creator.avgViews}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Top Themes</p>
            <div className="flex flex-wrap gap-1">
              {creator.topContentThemes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full bg-violet-950/50 px-2 py-0.5 text-xs text-violet-300"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marketing request input */}
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <MarketingRequest
          onSubmit={handleMarketingRequest}
          loading={agentLoading}
        />
        {agentError && (
          <p className="mt-3 text-sm text-red-400">{agentError}</p>
        )}
      </div>

      {/* Overall strategy (shown after Mistral generates it) */}
      {strategyResult && (
        <div className="mb-8 rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Overall PR Strategy
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {strategyResult.overallStrategy}
          </p>
        </div>
      )}

      {/* Brand cards */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {brands.length} Brand{brands.length !== 1 && "s"} Found
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {brands.map((brand) => (
          <BrandCard
            key={brand.domain}
            brand={brand}
            strategy={strategyMap.get(brand.domain)}
          />
        ))}
      </div>
    </div>
  );
}
