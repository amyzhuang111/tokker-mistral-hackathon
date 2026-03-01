"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Copy, Check, Sparkles, ArrowRight } from "lucide-react";
import type { PRStrategyResult } from "@/types/flow";

interface EmbeddedWallet {
  address: string;
  walletClientType: string;
}

interface StepPayoutWalletProps {
  embeddedWallet: EmbeddedWallet | undefined;
  createWallet: () => Promise<unknown>;
  strategyResult: PRStrategyResult | null;
}

export default function StepPayoutWallet({
  embeddedWallet,
  createWallet,
  strategyResult,
}: StepPayoutWalletProps) {
  const [copied, setCopied] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);

  function copyAddress() {
    if (!embeddedWallet) return;
    navigator.clipboard.writeText(embeddedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pitchCount = strategyResult?.brandStrategies.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Accomplishment summary */}
      {pitchCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-success/20 bg-success/5 p-5 text-center"
        >
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-success" />
          <h2 className="text-lg font-bold text-white">
            You&apos;re all set
          </h2>
          <p className="mt-1 text-sm text-muted">
            {pitchCount} pitch{pitchCount !== 1 && "es"} ready to send.
            Set up your payout wallet to receive payments.
          </p>
        </motion.div>
      )}

      {/* Wallet card */}
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-brand" />
          <h3 className="text-base font-bold text-white">Payout Wallet</h3>
        </div>

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
