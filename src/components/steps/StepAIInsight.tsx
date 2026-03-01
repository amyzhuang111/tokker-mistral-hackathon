"use client";

import CreatorProfileCard from "@/components/CreatorProfileCard";
import type { ClayCreator } from "@/lib/clay";
import type { BrandEnrichment } from "@/lib/mistral";

interface StepAIInsightProps {
  creator: ClayCreator;
  onBrandsDiscovered: (brands: BrandEnrichment[]) => void;
}

export default function StepAIInsight({
  creator,
  onBrandsDiscovered,
}: StepAIInsightProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Your AI Insight</h2>
        <p className="text-sm text-muted">
          Here&apos;s what we know about your creator profile
        </p>
      </div>
      <CreatorProfileCard
        creator={creator}
        onBrandsDiscovered={onBrandsDiscovered}
      />
    </div>
  );
}
