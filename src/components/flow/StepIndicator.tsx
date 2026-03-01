"use client";

import { motion } from "framer-motion";
import type { FlowStep } from "@/types/flow";

const stepLabels: Record<FlowStep, string> = {
  1: "Insight",
  2: "Brands",
  3: "Prompt",
  4: "Pitches",
};

interface StepIndicatorProps {
  currentStep: FlowStep;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {([1, 2, 3, 4] as FlowStep[]).map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex flex-col items-center gap-1">
            <motion.div
              className={`h-2 rounded-full transition-colors ${
                isActive
                  ? "w-6 bg-brand"
                  : isCompleted
                    ? "w-2 bg-brand/60"
                    : "w-2 bg-white/10"
              }`}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <span
              className={`text-[10px] ${
                isActive
                  ? "font-medium text-brand"
                  : isCompleted
                    ? "text-brand/60"
                    : "text-subtle"
              }`}
            >
              {stepLabels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
