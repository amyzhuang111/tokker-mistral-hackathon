"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useLoginWithOAuth } from "@privy-io/react-auth";
import { motion, AnimatePresence } from "framer-motion";


const testimonials = [
  {
    quote: "Tokker found me 3 brand deals in my first week. I didn't write a single email.",
    handle: "@fitnessjenna",
    followers: "340K",
  },
  {
    quote: "The pitches it writes are better than what my manager used to send. Seriously.",
    handle: "@chloecooks",
    followers: "128K",
  },
  {
    quote: "Went from cold-DMing brands to having personalized scripts in seconds.",
    handle: "@alexlifts",
    followers: "89K",
  },
];

export default function LoginPage() {
  const { ready, authenticated, user } = usePrivy();
  const { initOAuth } = useLoginWithOAuth();
  const router = useRouter();
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const tiktokUsername = user?.tiktok?.username;
  const googleEmail = user?.google?.email;

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[testimonialIdx];

  return (
    <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-sm flex-col items-center gap-8 text-center"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/tokker.png"
            alt="Tokker"
            className="h-24 w-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Tokker
            </h1>
            <p className="mt-1 text-sm font-medium text-brand">
              Land brand deals on autopilot
            </p>
          </div>
        </div>

        {/* Testimonial carousel */}
        <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-1 p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col justify-between"
            >
              <p className="text-sm leading-relaxed text-white/80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="text-xs text-muted">
                {t.handle} &middot; {t.followers} followers
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Auth buttons */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={() =>
              googleEmail
                ? router.push("/dashboard")
                : initOAuth({ provider: "google" })
            }
            disabled={!ready}
            className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
              googleEmail
                ? "border border-brand/30 bg-brand/10 text-brand hover:bg-brand/20"
                : "bg-white text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleEmail
              ? `Signed in as ${googleEmail} →`
              : "Sign in with Google"}
          </button>

          <button
            onClick={() =>
              tiktokUsername
                ? router.push("/dashboard")
                : initOAuth({ provider: "tiktok" })
            }
            disabled={!ready}
            className={`flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-3.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
              tiktokUsername
                ? "border-brand/30 bg-brand/10 text-brand hover:bg-brand/20"
                : "border-white/[0.08] bg-surface-1 text-white hover:bg-surface-2"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.82a8.16 8.16 0 0 0 4.76 1.52V6.89a4.85 4.85 0 0 1-1-.2z" />
            </svg>
            {tiktokUsername
              ? `Signed in as @${tiktokUsername} →`
              : "Sign in with TikTok"}
          </button>
        </div>

        {/* Social proof */}
        <div className="flex flex-col items-center gap-2 text-xs text-muted">
          <div className="flex items-center gap-4">
            <span>3,200+ creators</span>
            <span className="h-3 w-px bg-white/10" />
            <span>$2.4M in deals</span>
            <span className="h-3 w-px bg-white/10" />
            <span>500+ brands</span>
          </div>
          <p className="text-subtle">
            Avg. creator lands their first deal within 48 hours
          </p>
        </div>
      </motion.div>
    </div>
  );
}
