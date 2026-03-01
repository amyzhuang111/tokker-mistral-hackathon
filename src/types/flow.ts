import type { ClayCreator } from "@/lib/clay";
import type { Brand, BrandStrategy } from "@/components/BrandCard";

export type FlowStep = 1 | 2 | 3 | 4;

export type SortMode = "all" | "best-fit" | "highest-value";

export interface EnrichmentData {
  creator: ClayCreator;
  brands: Brand[];
}

export interface PRStrategyResult {
  overallStrategy: string;
  brandStrategies: BrandStrategy[];
}

export interface FlowData {
  enrichment: EnrichmentData;
  selectedBrands: Set<string>;
  sortMode: SortMode;
  marketingPrompt: string;
  strategyResult: PRStrategyResult | null;
  agentLoading: boolean;
  agentError: string | null;
  hasAnimatedConfetti: boolean;
}
