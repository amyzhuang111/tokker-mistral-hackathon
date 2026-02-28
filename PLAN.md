Mistral Worldwide Hackathon — Game Plan
Track: Mistral AI | Location: San Francisco | Timeline: Feb 28 9AM → Mar 1 ~7PM Challenge entry: ElevenLabs (best use of ElevenLabs)

Important: Overall Flow

Create a web app to Paste in Tiktok Handle 
Clay API will get info on the Tiktok handle and audience
Creator makes marketing request (voice/text input)
Use Mistral as orchestrator agent (with input from Clay University) to create PR strategy and outreach to brands
Use Coinbase Developer Platform or Privy to create a stablecoin wallet (on Base) to receive creator payouts.

Tokker — AI PR Agent for TikTok Creators
The Problem
TikTok creators with real audiences (10K–1M followers) leave money on the table because brand outreach is manual, generic, and time-consuming. Creators don't know which brands are actively spending on influencer marketing, what those brands care about, or how to pitch them in a way that converts. Meanwhile, brands are drowning in low-quality inbound from creators who don't fit. The matchmaking is broken on both sides.
The Solution
Tokker is an agentic PR system for creators. A creator inputs their TikTok handle (or describes their niche via voice). The Mistral agent autonomously: (1) identifies high-fit brands using Clay's enrichment data, (2) crafts hyper-personalized pitch strategies per brand, (3) generates ready-to-send voice pitches via ElevenLabs, and (4) closes the loop with stablecoin payouts via the x402 protocol — so when a brand deal lands, the creator gets paid instantly in USDC with no invoicing friction. It's not a database or a marketplace — it's an autonomous agent that does the work of a PR rep and a payment processor.
How Each API Earns Its Place
Mistral is the brain. It runs as an agentic orchestrator using function calling — it decides which brands to research, what signals matter for a given creator's niche, how to frame the pitch angle, and what tone/script to produce. It's not just glue; it's making strategic decisions at every step. Multi-step reasoning, tool use, and planning are core to the architecture.

Clay is the data layer. It enriches brand/company profiles with signals that actually matter for creator partnerships: recent funding (= marketing budget), hiring for marketing/brand roles (= active in influencer spend), tech stack and industry vertical (= niche fit), company size and growth trajectory. Clay turns a brand name into an actionable profile the agent can reason over. Important integration note: Clay doesn't have a traditional REST API — it's table-based. The integration path is via webhooks: each Clay table has a unique webhook endpoint. The Mistral agent pushes brand/company names into a Clay table via webhook, Clay runs its enrichment columns (100+ data providers), and the enriched data is pulled back via HTTP action or a return webhook. For the hackathon, pre-configure a Clay table with the enrichment columns you need (company funding, headcount, job postings, tech stack) and expose it as a webhook the agent can hit. See Clay University: Using Clay as an API and HTTP API Integration for setup details.

ElevenLabs is the output layer. Instead of generating yet another cold email, Tokker produces a short, personalized voice pitch in the creator's own voice (cloned with permission) or a professional narrator voice. Voice pitches have dramatically higher engagement than text — they feel personal, they're harder to ignore, and they differentiate the creator from every other DM in the brand manager's inbox.

x402 (stablecoin payments) is the settlement layer. Once a brand accepts a deal, payment flows through the x402 protocol — an HTTP-native micropayment standard using USDC stablecoins. No invoicing, no net-30 terms, no payment processor skimming 10–20%. The agent can programmatically trigger and verify payments, making the entire pipeline autonomous from prospecting to payout. This is agentic commerce in its purest form: an AI agent that finds a deal, pitches it, and settles it — end to end.
User Flow (Demo Narrative)
Creator enters their TikTok handle or speaks a description of their content niche ("I make fitness content for college women, 85K followers, mostly workout routines and healthy recipes")
Mistral agent ingests the creator profile and formulates a brand search strategy — what verticals to target, what company signals to filter for
Agent calls Clay to pull enriched profiles for 5–10 high-fit brands (e.g., athletic wear startups that just raised a Series A, DTC supplement brands hiring for influencer marketing)
For each brand, Mistral analyzes the enrichment data and crafts a personalized pitch angle — why this creator is a fit, what content format to propose, what the brand gets out of it
Agent generates a short voice pitch script per brand, then calls ElevenLabs to synthesize audio
Creator sees a dashboard: brand cards with enrichment summaries, pitch scripts, and audio players. They review, tweak if needed, and send
When a brand accepts, the deal settles via x402 — USDC hits the creator's wallet instantly. The agent handles payment verification and confirmation autonomously


Architecture
Creator Input (TikTok handle or voice description)
        │
        ▼
  ┌─────────────────────────────────┐
  │   Mistral Agent (orchestrator)    │
  │   - function calling              │
  │   - multi-step planning           │
  │   - tool selection logic          │
  └─────────┬─────────────────────┘
            │
    ┌───────┼───────────┬──────────┐
    ▼       ▼           ▼          ▼
  Clay    Mistral     ElevenLabs  x402
  API     (analysis)   API        Protocol
    │       │           │          │
    ▼       ▼           ▼          ▼
  Brand   Pitch      Voice      Stablecoin
  Enrichment Strategy  Pitches   Settlement
    │       │           │          │
    └───────┼───────────┼──────────┘
            ▼
    Creator Dashboard
    (brand cards + scripts + audio + payments)

Stack: Next.js (App Router) deployed on Vercel. All agent logic lives in API routes (/api/agent, /api/enrich, /api/voice, /api/pay). Mistral function calling as the agent backbone. Frontend is React via Next.js pages — single deployable artifact, no separate backend to manage. Vercel gives you instant deploys, preview URLs for the judges, and serverless functions for the API routes.

Why Next.js + Vercel for a hackathon: One repo, one deploy command. API routes handle all server-side logic (Mistral calls, Clay webhooks, ElevenLabs requests, x402 transactions) while the frontend renders the creator dashboard. Judges get a live URL they can click — no "run it locally" friction. Vercel's edge functions also keep latency low for the demo.

Project structure:

tokker/
├── app/
│   ├── page.tsx              # Landing / creator input form
│   ├── dashboard/
│   │   └── page.tsx          # Brand cards + pitch scripts + audio players + payment status
│   └── api/
│       ├── agent/route.ts    # Mistral orchestrator — function calling loop
│       ├── enrich/route.ts   # Clay webhook trigger + polling/callback handler
│       ├── voice/route.ts    # ElevenLabs TTS generation
│       └── pay/route.ts      # x402 stablecoin settlement
├── lib/
│   ├── mistral.ts            # Mistral client + tool definitions
│   ├── clay.ts               # Clay webhook helpers
│   ├── elevenlabs.ts         # ElevenLabs API wrapper
│   └── x402.ts               # x402 payment helpers
├── components/
│   ├── BrandCard.tsx          # Enrichment summary + pitch + audio
│   ├── CreatorInput.tsx       # Handle/voice input
│   └── PaymentStatus.tsx      # On-chain tx confirmation
├── .env.local                 # API keys (gitignored)
└── vercel.json                # Deploy config (if needed)

Key technical decisions:

Mistral's function calling API defines Clay, ElevenLabs, and x402 as tools with structured schemas. The agent decides when and how to call them — this is what makes it agentic rather than a hardcoded pipeline.
Clay integration via webhooks: Pre-build a Clay table with enrichment columns (company funding via Crunchbase, job postings, headcount, tech stack, social presence). Expose the table's webhook URL as the agent's "enrich_brand" tool. The Mistral agent POSTs a company domain → Clay enriches → agent polls or receives a callback with structured data. Pre-cache results for demo reliability.
Clay enrichment results are cached per brand to avoid redundant calls during iteration.
ElevenLabs voice generation is async — the UI shows a loading state and streams audio when ready.
Creator voice cloning (optional stretch goal): if the creator uploads a voice sample, ElevenLabs clones it so pitches go out in their voice.
x402 integration: the agent registers a payment endpoint. When a brand accepts a deal, the x402 protocol facilitates USDC transfer to the creator's wallet. Mistral handles the negotiation state (proposed → accepted → paid) and triggers settlement autonomously.


