"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWallets, useCreateWallet } from "@privy-io/react-auth";
import StepSlider from "./StepSlider";
import StepIndicator from "./StepIndicator";
import StepNavigation from "./StepNavigation";
import StepAIInsight from "@/components/steps/StepAIInsight";
import StepSelectBrands from "@/components/steps/StepSelectBrands";
import StepMarketingPrompt from "@/components/steps/StepMarketingPrompt";
import StepGeneratedPitches from "@/components/steps/StepGeneratedPitches";
import type {
  FlowStep,
  SortMode,
  EnrichmentData,
  PRStrategyResult,
} from "@/types/flow";
import type { Brand, BrandStrategy } from "@/components/BrandCard";
import type { BrandEnrichment } from "@/lib/mistral";

interface DashboardFlowProps {
  initialData: EnrichmentData;
}

/** Clamp step to what data supports */
function clampStep(
  step: number,
  hasBrands: boolean,
  hasSelected: boolean,
  hasStrategy: boolean
): FlowStep {
  if (step >= 4 && hasStrategy) return 4;
  if (step >= 3 && hasSelected) return 3;
  if (step >= 2 && hasBrands) return 2;
  return 1;
}

export default function DashboardFlow({ initialData }: DashboardFlowProps) {
  // --- Navigation state ---
  const [currentStep, setCurrentStep] = useState<FlowStep>(1);
  const [direction, setDirection] = useState(1);

  // --- Data state ---
  const [data, setData] = useState<EnrichmentData>(initialData);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [marketingPrompt, setMarketingPrompt] = useState("");
  const [strategyResult, setStrategyResult] =
    useState<PRStrategyResult | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [hasAnimatedConfetti, setHasAnimatedConfetti] = useState(false);
  const [showStrategy, setShowStrategy] = useState(true);

  // --- Wallet ---
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  // --- Session restore ---
  useEffect(() => {
    // Restore selected brands
    const storedBrands = sessionStorage.getItem("tokker_selected_brands");
    if (storedBrands) {
      try {
        setSelectedBrands(new Set(JSON.parse(storedBrands)));
      } catch {}
    } else {
      autoSelectTop3(data.brands);
    }

    // Restore strategy
    const storedStrategy = sessionStorage.getItem("tokker_strategy");
    if (storedStrategy) {
      try {
        const parsed = JSON.parse(storedStrategy);
        setStrategyResult(parsed);
        setHasAnimatedConfetti(true);
      } catch {}
    }

    // Restore step
    const storedStep = sessionStorage.getItem("tokker_last_step");
    if (storedStep) {
      const step = parseInt(storedStep, 10);
      const hasBrands = data.brands.length > 0;
      const hasSelected = storedBrands
        ? JSON.parse(storedBrands).length > 0
        : false;
      const hasStrategy = !!storedStrategy;
      setCurrentStep(clampStep(step, hasBrands, hasSelected, hasStrategy));
    }
  }, []);

  // --- Persist selected brands & step ---
  useEffect(() => {
    sessionStorage.setItem(
      "tokker_selected_brands",
      JSON.stringify([...selectedBrands])
    );
  }, [selectedBrands]);

  useEffect(() => {
    sessionStorage.setItem("tokker_last_step", String(currentStep));
  }, [currentStep]);

  // --- Brand callbacks ---
  function autoSelectTop3(brands: Brand[]) {
    const top = [...brands]
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3)
      .map((b) => b.domain);
    setSelectedBrands(new Set(top));
  }

  const handleBrandsDiscovered = useCallback(
    (brands: BrandEnrichment[]) => {
      setData((prev) => {
        const updated = { ...prev, brands: brands as Brand[] };
        sessionStorage.setItem("tokker_enrichment", JSON.stringify(updated));
        return updated;
      });
      autoSelectTop3(brands as Brand[]);
      setStrategyResult(null);
      sessionStorage.removeItem("tokker_strategy");
    },
    []
  );

  function toggleBrand(domain: string) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  function toggleAllBrands() {
    if (selectedBrands.size === data.brands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(data.brands.map((b) => b.domain)));
    }
  }

  // --- Strategy map ---
  const strategyMap = useMemo(() => {
    const map = new Map<string, BrandStrategy>();
    if (strategyResult) {
      for (const s of strategyResult.brandStrategies) {
        map.set(s.brandDomain, s);
      }
    }
    return map;
  }, [strategyResult]);

  // --- Agent call ---
  async function handleMarketingRequest(request: string) {
    const brandsToSend = data.brands.filter((b) => selectedBrands.has(b.domain));
    if (brandsToSend.length === 0) return;
    setAgentLoading(true);
    setAgentError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: data.creator,
          brands: brandsToSend,
          marketingRequest: request,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Something went wrong on our end");
      }

      const result: PRStrategyResult = await res.json();
      setStrategyResult(result);
      sessionStorage.setItem("tokker_strategy", JSON.stringify(result));

      // Auto-advance to Step 4
      setDirection(1);
      setCurrentStep(4);
    } catch (err) {
      setAgentError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setAgentLoading(false);
    }
  }

  // --- Pitch editing ---
  function handlePitchEdit(
    domain: string,
    field: "subjectLine" | "pitchScript",
    value: string
  ) {
    setStrategyResult((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        brandStrategies: prev.brandStrategies.map((s) =>
          s.brandDomain === domain ? { ...s, [field]: value } : s
        ),
      };
      sessionStorage.setItem("tokker_strategy", JSON.stringify(updated));
      return updated;
    });
  }

  // --- Navigation ---
  function goForward() {
    if (currentStep >= 4) return;
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 4) as FlowStep);
  }

  function goBack() {
    if (currentStep <= 1) return;
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1) as FlowStep);
  }

  // --- Forward CTA config ---
  function getForwardLabel(): string {
    switch (currentStep) {
      case 1:
        return "Start your campaign";
      case 2:
        return `Continue with ${selectedBrands.size} brand${selectedBrands.size !== 1 ? "s" : ""}`;
      case 3:
        return "Write my pitches";
      default:
        return "";
    }
  }

  function isForwardDisabled(): boolean {
    switch (currentStep) {
      case 1:
        return data.brands.length === 0;
      case 2:
        return selectedBrands.size === 0;
      case 3:
        return !marketingPrompt.trim();
      default:
        return true;
    }
  }

  function handleForward() {
    if (currentStep === 3) {
      if (marketingPrompt.trim()) {
        handleMarketingRequest(marketingPrompt.trim());
      }
      return;
    }
    goForward();
  }

  return (
    <div className="pb-24">
      <StepIndicator currentStep={currentStep} />

      <StepSlider step={currentStep} direction={direction}>
        {currentStep === 1 && (
          <StepAIInsight
            creator={data.creator}
            onBrandsDiscovered={handleBrandsDiscovered}
          />
        )}
        {currentStep === 2 && (
          <StepSelectBrands
            brands={data.brands}
            selectedBrands={selectedBrands}
            sortMode={sortMode}
            strategyMap={strategyMap}
            onToggleBrand={toggleBrand}
            onToggleAll={toggleAllBrands}
            onSortChange={setSortMode}
          />
        )}
        {currentStep === 3 && (
          <StepMarketingPrompt
            brands={data.brands}
            selectedBrands={selectedBrands}
            agentLoading={agentLoading}
            agentError={agentError}
            onSubmit={handleMarketingRequest}
            onRetry={() => {
              if (marketingPrompt.trim()) {
                handleMarketingRequest(marketingPrompt.trim());
              }
            }}
            onClearError={() => setAgentError(null)}
            promptText={marketingPrompt}
            onPromptChange={setMarketingPrompt}
          />
        )}
        {currentStep === 4 && strategyResult && (
          <StepGeneratedPitches
            brands={data.brands}
            selectedBrands={selectedBrands}
            strategyResult={strategyResult}
            hasAnimatedConfetti={hasAnimatedConfetti}
            onConfettiDone={() => setHasAnimatedConfetti(true)}
            showStrategy={showStrategy}
            onToggleStrategy={() => setShowStrategy((s) => !s)}
            embeddedWallet={embeddedWallet}
            createWallet={createWallet}
            onPitchEdit={handlePitchEdit}
          />
        )}
      </StepSlider>

      <StepNavigation
        currentStep={currentStep}
        onBack={goBack}
        onForward={handleForward}
        forwardLabel={getForwardLabel()}
        forwardDisabled={isForwardDisabled()}
        forwardLoading={currentStep === 3 && agentLoading}
      />
    </div>
  );
}
