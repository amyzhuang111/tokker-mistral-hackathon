"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import CreatorInput from "@/components/CreatorInput";

export default function Home() {
  const { ready, authenticated, user } = usePrivy();

  const tiktokHandle = user?.tiktok?.username;
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Tokker
          </h1>
          <p className="mt-2 text-lg text-violet-400">
            AI PR Agent for TikTok Creators
          </p>
        </div>

        <p className="max-w-md text-zinc-400">
          Paste your TikTok handle and we&apos;ll find high-fit brands, craft
          personalized pitches, and help you land paid partnerships — all
          autonomously.
        </p>

        <CreatorInput defaultHandle={tiktokHandle} />

        <p className="text-xs text-zinc-600">
          Powered by Mistral &middot; Clay &middot; ElevenLabs &middot; x402
        </p>
      </div>
    </div>
  );
}
