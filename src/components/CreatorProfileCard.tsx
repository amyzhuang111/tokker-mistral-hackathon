"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Globe,
  Mail,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ClayCreator } from "@/lib/clay";
import type { CreatorSummary, BrandEnrichment } from "@/lib/mistral";

interface CreatorProfileCardProps {
  creator: ClayCreator;
  onBrandsDiscovered?: (brands: BrandEnrichment[]) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted" />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function AudienceBar({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium text-white/70">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

export default function CreatorProfileCard({
  creator,
  onBrandsDiscovered,
}: CreatorProfileCardProps) {
  const [summary, setSummary] = useState<CreatorSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showAudience, setShowAudience] = useState(false);

  // Fetch AI summary on mount (or when creator changes)
  useEffect(() => {
    // Check cache — but only use it if it matches the current creator
    const cached = sessionStorage.getItem("tokker_summary");
    const cachedHandle = sessionStorage.getItem("tokker_summary_handle");
    if (cached && cachedHandle === creator.handle) {
      const parsed: CreatorSummary = JSON.parse(cached);
      setSummary(parsed);
      if (parsed.suggestedBrands?.length) {
        onBrandsDiscovered?.(parsed.suggestedBrands);
      }
      return;
    }

    // Clear stale cache for a different creator
    sessionStorage.removeItem("tokker_summary");
    sessionStorage.removeItem("tokker_summary_handle");
    setSummary(null);
    setSummaryError(null);
    setSummaryLoading(true);

    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Summarize failed (${res.status})`);
        }
        return res.json();
      })
      .then((data: CreatorSummary | null) => {
        if (data) {
          setSummary(data);
          sessionStorage.setItem("tokker_summary", JSON.stringify(data));
          sessionStorage.setItem("tokker_summary_handle", creator.handle);
          if (data.suggestedBrands?.length) {
            onBrandsDiscovered?.(data.suggestedBrands);
          }
        }
      })
      .catch((err) => {
        console.error("AI summary error:", err);
        setSummaryError(err instanceof Error ? err.message : "Failed to generate summary");
      })
      .finally(() => setSummaryLoading(false));
  }, [creator]);

  const hasRichData = !!(creator.bio || creator.engagementRate);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
      {/* Top row: avatar + name + basic info */}
      <div className="mb-4 flex items-start gap-4">
        {creator.picture ? (
          <img
            src={creator.picture}
            alt={creator.fullname ?? creator.handle}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-2xl font-bold text-brand">
            {creator.handle.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-white">
            {creator.fullname ?? `@${creator.handle}`}
          </h1>
          <p className="text-sm text-muted">@{creator.handle}</p>
          {creator.bio && (
            <p className="mt-1 text-sm leading-relaxed text-white/60">
              {creator.bio}
            </p>
          )}
          {creator.email && (
            <a
              href={`mailto:${creator.email}`}
              className="mt-1 inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <Mail className="h-3 w-3" /> {creator.email}
            </a>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Followers"
          value={creator.followers}
        />
        <StatCard
          icon={Eye}
          label="Avg Views"
          value={creator.avgViews}
        />
        {creator.engagementRate != null && (
          <StatCard
            icon={TrendingUp}
            label="Engagement"
            value={`${(creator.engagementRate * 100).toFixed(2)}%`}
          />
        )}
        {creator.avgLikes != null && (
          <StatCard
            icon={Heart}
            label="Avg Likes"
            value={String(creator.avgLikes)}
          />
        )}
        {creator.avgComments != null && (
          <StatCard
            icon={MessageCircle}
            label="Avg Comments"
            value={String(creator.avgComments)}
          />
        )}
        {creator.country && (
          <StatCard
            icon={Globe}
            label="Country"
            value={creator.country}
          />
        )}
        {creator.paidPostPerformance != null && (
          <StatCard
            icon={TrendingUp}
            label="Paid Post Perf."
            value={`${(creator.paidPostPerformance * 100).toFixed(0)}%`}
          />
        )}
        {creator.postsCount != null && (
          <StatCard
            icon={Eye}
            label="Total Posts"
            value={String(creator.postsCount)}
          />
        )}
      </div>

      {/* Content theme tags */}
      {creator.topContentThemes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {creator.topContentThemes.map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
            >
              #{theme}
            </span>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {summaryLoading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand/5 p-4">
          <Sparkles className="h-4 w-4 animate-pulse text-brand" />
          <p className="text-sm text-muted">Generating AI insights...</p>
        </div>
      )}

      {summaryError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 p-4">
          <Sparkles className="h-4 w-4 text-red-400" />
          <p className="flex-1 text-sm text-red-400">{summaryError}</p>
          <button
            onClick={() => {
              setSummaryError(null);
              setSummaryLoading(true);
              fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creator }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || `Summarize failed (${res.status})`);
                  }
                  return res.json();
                })
                .then((data: CreatorSummary | null) => {
                  if (data) {
                    setSummary(data);
                    sessionStorage.setItem("tokker_summary", JSON.stringify(data));
                    sessionStorage.setItem("tokker_summary_handle", creator.handle);
                    if (data.suggestedBrands?.length) {
                      onBrandsDiscovered?.(data.suggestedBrands);
                    }
                  }
                })
                .catch((err) => {
                  setSummaryError(err instanceof Error ? err.message : "Failed to generate summary");
                })
                .finally(() => setSummaryLoading(false));
            }}
            className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 space-y-3 rounded-xl bg-brand/5 p-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-xs font-bold text-brand">AI Summary</span>
            {summary.nicheSuggestion && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                {summary.nicheSuggestion}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            {summary.summary}
          </p>

          {/* AI Tags */}
          {summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summary.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Insights */}
          {summary.insights.length > 0 && (
            <ul className="space-y-1">
              {summary.insights.map((insight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-white/60"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      {/* Expandable audience demographics */}
      {hasRichData &&
        (creator.audienceAges || creator.audienceGenders || creator.audienceCountries) && (
          <>
            <button
              onClick={() => setShowAudience(!showAudience)}
              className="flex w-full items-center justify-between py-2 text-xs text-muted transition hover:text-white"
              aria-expanded={showAudience}
            >
              <span>
                {showAudience ? "Hide audience data" : "View audience demographics"}
              </span>
              {showAudience ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showAudience && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden pt-2"
              >
                {/* Gender */}
                {creator.audienceGenders && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Gender Split
                    </p>
                    <div className="space-y-1.5">
                      {creator.audienceGenders.map((g) => (
                        <AudienceBar
                          key={g.code}
                          label={g.code === "FEMALE" ? "Female" : "Male"}
                          percent={g.weight * 100}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ages */}
                {creator.audienceAges && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Age Distribution
                    </p>
                    <div className="space-y-1.5">
                      {creator.audienceAges
                        .filter((a) => a.weight > 0.01)
                        .map((a) => (
                          <AudienceBar
                            key={a.code}
                            label={a.code}
                            percent={a.weight * 100}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Countries */}
                {creator.audienceCountries && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">
                      Top Countries
                    </p>
                    <div className="space-y-1.5">
                      {creator.audienceCountries.slice(0, 6).map((c) => (
                        <AudienceBar
                          key={c.code}
                          label={c.name ?? c.code}
                          percent={c.weight * 100}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
    </div>
  );
}
