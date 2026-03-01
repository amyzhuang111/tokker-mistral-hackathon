"use client";

import { useMemo } from "react";
import { CheckSquare, Square } from "lucide-react";
import BrandCard from "@/components/BrandCard";
import type { Brand, BrandStrategy } from "@/components/BrandCard";
import type { SortMode } from "@/types/flow";

interface StepSelectBrandsProps {
  brands: Brand[];
  selectedBrands: Set<string>;
  sortMode: SortMode;
  strategyMap: Map<string, BrandStrategy>;
  onToggleBrand: (domain: string) => void;
  onToggleAll: () => void;
  onSortChange: (mode: SortMode) => void;
}

export default function StepSelectBrands({
  brands,
  selectedBrands,
  sortMode,
  strategyMap,
  onToggleBrand,
  onToggleAll,
  onSortChange,
}: StepSelectBrandsProps) {
  const sortedBrands = useMemo(() => {
    const sorted = [...brands];
    if (sortMode === "best-fit") {
      sorted.sort((a, b) => b.fitScore - a.fitScore);
    } else if (sortMode === "highest-value") {
      sorted.sort((a, b) => {
        const aStrat = strategyMap.get(a.domain);
        const bStrat = strategyMap.get(b.domain);
        if (aStrat && !bStrat) return -1;
        if (!aStrat && bStrat) return 1;
        return b.fitScore - a.fitScore;
      });
    }
    return sorted;
  }, [brands, sortMode, strategyMap]);

  const allSelected = selectedBrands.size === brands.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">
          {brands.length} brand{brands.length !== 1 && "s"} that match your
          vibe
        </h2>
        <p className="text-sm text-muted">
          Select the brands you want to pitch to
        </p>
      </div>

      {/* Filter tabs + select all */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleAll}
          className="flex items-center gap-1.5 text-xs text-muted transition hover:text-white"
        >
          {allSelected ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          {allSelected ? "Deselect all" : "Select all"}
        </button>
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
              onClick={() => onSortChange(mode)}
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

      {/* Brand grid */}
      {sortedBrands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedBrands.map((brand, i) => (
            <BrandCard
              key={brand.domain}
              brand={brand}
              strategy={strategyMap.get(brand.domain)}
              variant="ghost"
              index={i}
              selected={selectedBrands.has(brand.domain)}
              onToggle={() => onToggleBrand(brand.domain)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-white">No matches yet</p>
          <p className="mt-1 text-sm text-muted">
            Try a different niche or check back soon — we&apos;re always adding
            new brands.
          </p>
        </div>
      )}
    </div>
  );
}
