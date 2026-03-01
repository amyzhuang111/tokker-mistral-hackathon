"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Wallet,
  Copy,
  Check,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import BrandCard from "@/components/BrandCard";
import type { Brand, BrandStrategy } from "@/components/BrandCard";
import type { PRStrategyResult } from "@/types/flow";

interface EmbeddedWallet {
  address: string;
  walletClientType: string;
}

interface StepGeneratedPitchesProps {
  brands: Brand[];
  selectedBrands: Set<string>;
  strategyResult: PRStrategyResult;
  hasAnimatedConfetti: boolean;
  onConfettiDone: () => void;
  showStrategy: boolean;
  onToggleStrategy: () => void;
  embeddedWallet: EmbeddedWallet | undefined;
  createWallet: () => Promise<unknown>;
  onPitchEdit: (domain: string, field: "subjectLine" | "pitchScript", value: string) => void;
}

export default function StepGeneratedPitches({
  brands,
  selectedBrands,
  strategyResult,
  hasAnimatedConfetti,
  onConfettiDone,
  showStrategy,
  onToggleStrategy,
  embeddedWallet,
  createWallet,
  onPitchEdit,
}: StepGeneratedPitchesProps) {
  const [copied, setCopied] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);

  const strategyMap = useMemo(() => {
    const map = new Map<string, BrandStrategy>();
    for (const s of strategyResult.brandStrategies) {
      map.set(s.brandDomain, s);
    }
    return map;
  }, [strategyResult]);

  const activatedBrands = brands.filter((b) => selectedBrands.has(b.domain));

  // Parse estimated values to compute total
  const totalEarnings = useMemo(() => {
    let total = 0;
    for (const s of strategyResult.brandStrategies) {
      const nums = s.estimatedValue.match(/[\d,]+/g);
      if (nums && nums.length >= 1) {
        const values = nums.map((n) => parseInt(n.replace(/,/g, ""), 10));
        total += values.reduce((a, b) => a + b, 0) / values.length;
      }
    }
    return Math.round(total);
  }, [strategyResult]);

  // Fire confetti once
  useEffect(() => {
    if (!hasAnimatedConfetti) {
      onConfettiDone();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FE2C55", "#25F4EE", "#00DC82", "#FFB800"],
      });
    }
  }, [hasAnimatedConfetti, onConfettiDone]);

  function copyAddress() {
    if (!embeddedWallet) return;
    navigator.clipboard.writeText(embeddedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h2 className="text-2xl font-extrabold text-white">
          Your pitches are ready
        </h2>
        <p className="mt-1 text-sm text-muted">
          {strategyResult.brandStrategies.length} personalized pitch
          {strategyResult.brandStrategies.length !== 1 && "es"} generated
        </p>
        {totalEarnings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2"
          >
            <DollarSign className="h-4 w-4 text-success" />
            <span className="text-sm font-bold text-success">
              Estimated total: ${totalEarnings.toLocaleString()}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Payout wallet — right under estimated total */}
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-brand" />
          <h3 className="flex-1 text-base font-bold text-white">Payout Wallet</h3>
          <button
            onClick={() => setShowWalletInfo((s) => !s)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/[0.04] hover:text-white"
            aria-expanded={showWalletInfo}
            aria-label="Learn about stablecoin payments"
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">How it works</span>
          </button>
        </div>

        {showWalletInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 space-y-3 overflow-hidden rounded-xl bg-brand/5 p-4"
          >
            <h4 className="text-sm font-semibold text-white">
              Stablecoin payments on Base
            </h4>
            <p className="text-sm leading-relaxed text-white/60">
              Brands pay you in <span className="font-medium text-white/80">USDC</span>, a stablecoin pegged 1:1 to the US dollar.
              Your wallet lives on <span className="font-medium text-white/80">Base</span>, a fast and low-cost network — so you receive
              payments in seconds with near-zero fees.
            </p>
            <ul className="space-y-1.5 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                1 USDC = $1 USD — no crypto volatility
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                Withdraw to your bank anytime via Coinbase or any exchange
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                Share your wallet address or QR code with brands to get paid
              </li>
            </ul>
            {embeddedWallet && (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${embeddedWallet.address}&bgcolor=FFFFFF&color=000000`}
                  alt="Wallet QR code"
                  className="h-40 w-40"
                />
                <p className="font-mono text-xs text-zinc-500">
                  {embeddedWallet.address}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {embeddedWallet ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <code className="text-sm text-white/70">
                {embeddedWallet.address.slice(0, 6)}...
                {embeddedWallet.address.slice(-4)}
              </code>
              <button
                onClick={copyAddress}
                className="text-muted transition hover:text-white"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted">$0.00 USDC</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Create a wallet to receive brand deal payments directly.
            </p>
            <button
              onClick={async () => {
                setCreatingWallet(true);
                try {
                  await createWallet();
                } finally {
                  setCreatingWallet(false);
                }
              }}
              disabled={creatingWallet}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50"
            >
              {creatingWallet ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Create Wallet
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Overall strategy banner */}
      {strategyResult.overallStrategy && (
        <div>
          {showStrategy ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-success/20 bg-success/5 p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-success" />
                  <h3 className="text-sm font-bold text-success">
                    Your game plan
                  </h3>
                </div>
                <button
                  onClick={onToggleStrategy}
                  className="text-success/40 transition hover:text-success"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {strategyResult.overallStrategy}
              </p>
            </motion.div>
          ) : (
            <button
              onClick={onToggleStrategy}
              className="flex items-center gap-2 text-xs text-success transition hover:text-success/80"
            >
              <Sparkles className="h-3 w-3" />
              Show your game plan
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Activated brand cards — editable pitches */}
      <div className="grid gap-4 md:grid-cols-2">
        {activatedBrands.map((brand, i) => (
          <BrandCard
            key={brand.domain}
            brand={brand}
            strategy={strategyMap.get(brand.domain)}
            variant="activated"
            index={i}
            onPitchEdit={onPitchEdit}
          />
        ))}
      </div>

      {/* Next steps */}
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
        <h3 className="mb-3 text-sm font-bold text-white">What&apos;s next</h3>
        <ul className="space-y-3">
          {[
            "Copy your pitches and send them to brands",
            "Track responses and follow up within 3 days",
            "Negotiate terms and set your rates",
            "Get paid directly to your wallet",
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-white/70"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
