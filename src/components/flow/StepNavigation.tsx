"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { FlowStep } from "@/types/flow";

interface StepNavigationProps {
  currentStep: FlowStep;
  onBack: () => void;
  onForward: () => void;
  forwardLabel: string;
  forwardDisabled?: boolean;
  forwardLoading?: boolean;
}

export default function StepNavigation({
  currentStep,
  onBack,
  onForward,
  forwardLabel,
  forwardDisabled,
  forwardLoading,
}: StepNavigationProps) {
  const showBack = currentStep > 1;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-background/80 backdrop-blur-xl safe-area-bottom"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-1 text-muted transition hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-11 shrink-0" />
        )}

        {/* Terminal step (4) has no forward CTA */}
        {currentStep < 4 && (
          <button
            onClick={onForward}
            disabled={forwardDisabled || forwardLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-base font-semibold text-white transition hover:bg-brand/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {forwardLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              forwardLabel
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
