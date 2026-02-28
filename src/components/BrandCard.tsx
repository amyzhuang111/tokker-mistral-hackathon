"use client";

import { useState } from "react";

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
}

export default function BrandCard({ brand, strategy }: BrandCardProps) {
  const [showFullPitch, setShowFullPitch] = useState(false);

  const scoreColor =
    brand.fitScore >= 80
      ? "text-green-400"
      : brand.fitScore >= 60
        ? "text-yellow-400"
        : "text-zinc-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-violet-600/50">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{brand.name}</h3>
          <p className="text-sm text-zinc-500">{brand.domain}</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {brand.fitScore}
          </span>
          <p className="text-xs text-zinc-500">fit score</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-400">{brand.description}</p>

      {/* Enrichment data grid */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Industry</p>
          <p className="font-medium text-zinc-200">{brand.industry}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Funding</p>
          <p className="font-medium text-zinc-200">{brand.funding}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Headcount</p>
          <p className="font-medium text-zinc-200">{brand.headcount}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Recent News</p>
          <p className="font-medium text-zinc-200">{brand.recentNews}</p>
        </div>
      </div>

      {/* Fit reason */}
      <div className="mb-4 rounded-lg border border-violet-600/30 bg-violet-950/20 p-3">
        <p className="text-xs text-violet-400">Why this brand fits</p>
        <p className="text-sm text-zinc-300">{brand.fitReason}</p>
      </div>

      {/* Strategy section — only shown after Mistral generates it */}
      {strategy && (
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            PR Strategy
          </h4>

          {/* Pitch angle */}
          <div>
            <p className="text-xs text-zinc-500">Pitch Angle</p>
            <p className="text-sm text-zinc-200">{strategy.pitchAngle}</p>
          </div>

          {/* Estimated deal value */}
          <div>
            <p className="text-xs text-zinc-500">Estimated Deal Value</p>
            <p className="text-sm font-semibold text-emerald-400">
              {strategy.estimatedValue}
            </p>
          </div>

          {/* Content formats */}
          <div>
            <p className="mb-1 text-xs text-zinc-500">Content Formats</p>
            <div className="flex flex-wrap gap-1">
              {strategy.contentFormats.map((format) => (
                <span
                  key={format}
                  className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-xs text-emerald-300"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>

          {/* Talking points */}
          <div>
            <p className="mb-1 text-xs text-zinc-500">Talking Points</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
              {strategy.talkingPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Pitch script */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Subject: {strategy.subjectLine}
              </p>
              <button
                onClick={() => setShowFullPitch(!showFullPitch)}
                className="text-xs text-violet-400 transition hover:text-violet-300"
              >
                {showFullPitch ? "Collapse" : "View full pitch"}
              </button>
            </div>
            {showFullPitch && (
              <div className="rounded-lg bg-zinc-800/70 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                  {strategy.pitchScript}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(strategy.pitchScript);
                  }}
                  className="mt-3 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-600"
                >
                  Copy pitch
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
