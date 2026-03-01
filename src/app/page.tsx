"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import CreatorInput from "@/components/CreatorInput";

export default function Home() {
  const { ready, authenticated, user, logout } = usePrivy();
  const tiktokHandle = user?.tiktok?.username;
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="gradient-mesh flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="gradient-mesh relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img
            src="/tokker.png"
            alt="Tokker"
            className="h-8 w-8 rounded-full"
          />
          <span className="text-sm font-bold text-white">Tokker</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-surface-1 px-3 py-2 text-xs text-muted transition hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-lg flex-col items-center gap-8 text-center"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Find your perfect{" "}
            <span className="bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] bg-clip-text text-transparent">
              brand partnerships
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
            Drop your @ and we&apos;ll find brands that want to work with you.
          </p>
        </div>

        <CreatorInput defaultHandle={tiktokHandle ?? undefined} />
      </motion.div>
    </div>
  );
}
