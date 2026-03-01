"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import MarketingRequest from "@/components/MarketingRequest";
import PromptChips from "@/components/flow/PromptChips";
import type { Brand } from "@/components/BrandCard";

interface StepMarketingPromptProps {
  brands: Brand[];
  selectedBrands: Set<string>;
  agentLoading: boolean;
  agentError: string | null;
  onSubmit: (request: string) => void;
  onRetry: () => void;
  onClearError: () => void;
  promptText: string;
  onPromptChange: (text: string) => void;
}

export default function StepMarketingPrompt({
  brands,
  selectedBrands,
  agentLoading,
  agentError,
  onSubmit,
  onRetry,
  onClearError,
  promptText,
  onPromptChange,
}: StepMarketingPromptProps) {
  const selectedList = brands.filter((b) => selectedBrands.has(b.domain));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">
          Describe your campaign
        </h2>
        <p className="text-sm text-muted">
          Writing pitches for{" "}
          <span className="font-semibold text-brand">
            {selectedBrands.size}
          </span>{" "}
          brand{selectedBrands.size !== 1 && "s"}
        </p>
      </div>

      {/* Selected brands summary */}
      <div className="flex flex-wrap gap-1.5">
        {selectedList.map((b) => (
          <span
            key={b.domain}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`}
              alt=""
              className="h-3.5 w-3.5 rounded-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {b.name}
          </span>
        ))}
      </div>

      {/* Prompt chips */}
      <div>
        <p className="mb-2 text-xs text-muted">Quick ideas</p>
        <PromptChips
          onSelect={(chip) => {
            onPromptChange(promptText ? `${promptText} ${chip}` : chip);
          }}
        />
      </div>

      {/* Marketing request form */}
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
        <MarketingRequest
          onSubmit={onSubmit}
          loading={agentLoading}
          promptText={promptText}
          onPromptChange={onPromptChange}
          hideSubmitButton
        />
      </div>

      {/* Error with retry */}
      {agentError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-xl bg-brand/10 p-3"
        >
          <p className="flex-1 text-sm text-brand">{agentError}</p>
          <button
            onClick={onRetry}
            className="rounded-lg bg-brand/20 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/30"
          >
            Retry
          </button>
          <button
            onClick={onClearError}
            className="text-brand/60 hover:text-brand"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
