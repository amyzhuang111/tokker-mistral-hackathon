import CreatorInput from "@/components/CreatorInput";

export default function Home() {
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

        <CreatorInput />

        <p className="text-xs text-zinc-600">
          Powered by Mistral &middot; Clay &middot; ElevenLabs &middot; x402
        </p>
      </div>
    </div>
  );
}
