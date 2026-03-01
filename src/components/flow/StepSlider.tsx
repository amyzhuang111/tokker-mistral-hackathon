"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { FlowStep } from "@/types/flow";

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const slideTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

interface StepSliderProps {
  step: FlowStep;
  direction: number;
  children: React.ReactNode;
}

export default function StepSlider({ step, direction, children }: StepSliderProps) {
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
