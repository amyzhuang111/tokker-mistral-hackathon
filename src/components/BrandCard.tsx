"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Mail,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { estimateValue } from "@/lib/estimateValue";

export interface Brand {
  name: string;
  domain: string;
  industry: string;
  description: string;
  funding: string;
  headcount: string;
  recentNews: string;
  fitScore: number;
  fitReason: string;
}

export interface BrandStrategy {
  brandName: string;
  brandDomain: string;
  pitchAngle: string;
  contentFormats: string[];
  talkingPoints: string[];
  pitchScript: string;
  subjectLine: string;
  estimatedValue: string;
}

interface BrandCardProps {
  brand: Brand;
  strategy?: BrandStrategy;
  variant?: "ghost" | "activated";
  index?: number;
  selected?: boolean;
  onToggle?: () => void;
  estimatedRange?: string;
  followerCount?: string;
  onPitchEdit?: (domain: string, field: "subjectLine" | "pitchScript", value: string) => void;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-success"
      : score >= 60
        ? "text-warning"
        : "text-muted";

  const strokeColor =
    score >= 80 ? "#00DC82" : score >= 60 ? "#FFB800" : "#5A5A5A";

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
}

export default function BrandCard({
  brand,
  strategy,
  variant,
  index = 0,
  selected,
  onToggle,
  estimatedRange,
  followerCount,
  onPitchEdit,
}: BrandCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [copied, setCopied] = useState(false);

  const isGhost = variant === "ghost";
  const isActivated = variant === "activated";

  // Pre-pitch estimated range for ghost cards
  const displayRange =
    estimatedRange ?? (isGhost && followerCount
      ? estimateValue(brand.fitScore, followerCount)
      : null);

  function handleCopy() {
    if (!strategy) return;
    navigator.clipboard.writeText(strategy.pitchScript);
    setCopied(true);
    toast.success("Pitch copied — go get that bag");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendEmail() {
    if (!strategy) return;
    const subject = encodeURIComponent(strategy.subjectLine);
    const body = encodeURIComponent(strategy.pitchScript);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`group rounded-2xl border bg-surface-1 p-5 transition ${
        isActivated
          ? "activated-card border-success/40"
          : selected
            ? "border-brand/40 shadow-[0_0_16px_-4px_rgba(254,44,85,0.3)]"
            : isGhost
              ? "ghost-card border-white/[0.04]"
              : "border-white/[0.06] hover:border-brand/30"
      } ${selected === false && !isActivated ? "opacity-60" : ""}`}
    >
      {/* Header row: favicon + name + score ring + checkbox */}
      <div className="mb-3 flex items-center gap-3">
        <img
          src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`}
          alt=""
          className="h-10 w-10 rounded-lg bg-surface-2 p-1"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-bold text-white">
            {brand.name}
          </h3>
          <p className="text-xs text-muted">{brand.industry}</p>
        </div>
        <ScoreRing score={brand.fitScore} />
        {onToggle && (
          <button
            onClick={onToggle}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition ${
              selected
                ? "border-brand bg-brand text-white"
                : "border-white/20 bg-transparent text-transparent hover:border-white/40"
            }`}
            aria-label={selected ? "Deselect brand" : "Select brand"}
          >
            {selected && <Check className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Fit reason — one-liner */}
      <p className="mb-3 text-sm leading-relaxed text-white/70">
        {brand.fitReason}
      </p>

      {/* Deal value — hero treatment */}
      {selected !== false && strategy && (
        <div className="mb-3 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted">What you could earn</span>
            <span className="text-2xl font-extrabold text-success">
              {strategy.estimatedValue}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strategy.contentFormats.map((format) => (
              <span
                key={format}
                className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pre-pitch estimated range for ghost cards */}
      {!strategy && displayRange && selected !== false && (
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-xs text-muted">Est. deal value</span>
          <span className="text-lg font-bold text-white/40">
            {displayRange}
          </span>
        </div>
      )}

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-2 text-xs text-muted transition hover:text-white"
        aria-expanded={expanded}
      >
        <span>{expanded ? "Less details" : "About this brand"}</span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="space-y-3 overflow-hidden"
        >
          <p className="text-sm text-white/60">{brand.description}</p>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-surface-2 p-2.5">
              <p className="text-subtle">Funding</p>
              <p className="font-medium text-white/80">{brand.funding}</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5">
              <p className="text-subtle">Team size</p>
              <p className="font-medium text-white/80">{brand.headcount}</p>
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5">
              <p className="text-subtle">News</p>
              <p className="font-medium text-white/80">{brand.recentNews}</p>
            </div>
          </div>

          <a
            href={`https://${brand.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand transition hover:underline"
          >
            Visit website <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      )}

      {/* Strategy section — only when selected */}
      {selected !== false && strategy && (
        <div className="mt-3 space-y-3 border-t border-white/[0.04] pt-3">
          {/* Pitch angle */}
          <div>
            <p className="text-xs text-subtle">Pitch angle</p>
            <p className="text-sm text-white/80">{strategy.pitchAngle}</p>
          </div>

          {/* Talking points */}
          <div>
            <p className="mb-1 text-xs text-subtle">What to say</p>
            <ul className="space-y-1">
              {strategy.talkingPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-white/70"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Pitch toggle */}
          <button
            onClick={() => setShowPitch(!showPitch)}
            className="w-full rounded-xl bg-brand/10 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/15"
            aria-expanded={showPitch}
          >
            {showPitch ? "Hide pitch" : "View full pitch"}
          </button>

          {showPitch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="rounded-xl bg-surface-2 p-4 space-y-3">
                {/* Editable subject line */}
                <div>
                  <label className="mb-1 block text-xs text-subtle">Subject</label>
                  {onPitchEdit ? (
                    <input
                      type="text"
                      value={strategy.subjectLine}
                      onChange={(e) =>
                        onPitchEdit(brand.domain, "subjectLine", e.target.value)
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-surface-1 px-3 py-2 text-sm text-white outline-none transition focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
                    />
                  ) : (
                    <p className="text-sm text-white/80">
                      {strategy.subjectLine}
                    </p>
                  )}
                </div>

                {/* Editable pitch body */}
                <div>
                  <label className="mb-1 block text-xs text-subtle">Pitch</label>
                  {onPitchEdit ? (
                    <textarea
                      value={strategy.pitchScript}
                      onChange={(e) =>
                        onPitchEdit(brand.domain, "pitchScript", e.target.value)
                      }
                      rows={8}
                      className="w-full resize-y rounded-lg border border-white/[0.08] bg-surface-1 p-3 font-mono text-sm leading-relaxed text-white/80 outline-none transition focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/80">
                      {strategy.pitchScript}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-surface-2 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy pitch
                    </>
                  )}
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 active:scale-[0.98]"
                >
                  <Mail className="h-4 w-4" />
                  Send pitch
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
