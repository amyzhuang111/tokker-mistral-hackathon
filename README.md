# Tokker

**AI PR Agent for TikTok Creators** — Land brand deals on autopilot.

A creator inputs their TikTok handle, and Tokker uses Clay and Modash to enrich their audience profile with demographics, engagement rates, and content themes. Tokker then uses the Mistral API to summarize the creator's profile, suggest high-fit brand deals, and draft personalized outreach emails for each one. Tokker also creates a stablecoin wallet via Stripe Privy for creator payouts.

Built for the [Mistral Worldwide Hackathon](https://mistral.ai/) — San Francisco, Feb 28 - Mar 1, 2025.

## How It Works

1. **Log in** via TikTok or Google OAuth (Privy)
2. **Enter your TikTok handle** — Tokker enriches your profile using Clay + Modash (followers, engagement rate, audience demographics, top content themes)
3. **Review brand matches** — Mistral AI identifies 5 high-fit brands with fit scores, industry match reasoning, and company intel (funding, headcount, recent news)
4. **Select brands & describe your campaign** — pick the brands you want to pitch and describe what you're promoting (text or voice input)
5. **Get ready-to-send pitches** — Mistral generates a personalized pitch strategy, email scripts, subject lines, talking points, and estimated deal values for each brand
6. **Send** — copy to clipboard or open directly in your email client

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI | Mistral AI (`mistral-large-latest`) |
| Data Enrichment | Clay webhooks + Modash |
| Auth | Privy (TikTok & Google OAuth) |
| Payments | Stripe Privy (stablecoin wallet) |
| Styling | Tailwind CSS 4 + Framer Motion |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm / bun

### Setup

```bash
git clone https://github.com/your-org/tokker-mistral-hackathon.git
cd tokker-mistral-hackathon
npm install
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
MISTRAL_API_KEY=           # Required — from console.mistral.ai
NEXT_PUBLIC_PRIVY_APP_ID=  # Required — from dashboard.privy.io
PRIVY_APP_SECRET=          # Required — from dashboard.privy.io
CLAY_WEBHOOK_URL=          # Optional — falls back to Mistral-powered brand discovery
CLAY_API_KEY=              # Optional — Clay webhook auth token
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home — creator handle input
│   ├── login/page.tsx              # OAuth login
│   ├── dashboard/page.tsx          # Brand matches, pitches, strategy
│   └── api/
│       ├── enrich/route.ts         # Trigger Clay/Modash enrichment
│       ├── clay-callback/route.ts  # Receive Clay webhook data
│       ├── agent/route.ts          # Mistral pitch strategy agent
│       └── summarize/route.ts      # AI creator profile summary
├── components/
│   ├── CreatorInput.tsx            # Handle input + validation
│   ├── CreatorProfileCard.tsx      # Profile card + AI summary + demographics
│   ├── BrandCard.tsx               # Brand match card + pitch display
│   └── MarketingRequest.tsx        # Campaign input + voice support
└── lib/
    ├── mistral.ts                  # Mistral client — brand discovery, summarization, pitch agent
    └── clay.ts                     # Clay webhook trigger + enrichment normalization
```

## Architecture

```
Creator enters handle
        │
        ▼
   Clay + Modash ──────────► Enriched profile
        │                    (followers, engagement, audience, themes)
        ▼
   Mistral AI ─────────────► Brand matches with fit scores
        │
        ▼
   Creator selects brands
   + describes campaign
        │
        ▼
   Mistral Agent ──────────► Per-brand pitch strategy
                              (email scripts, talking points, deal values)
        │
        ▼
   Copy / Email ───────────► Send to brands
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/enrich` | Trigger creator profile enrichment |
| `GET` | `/api/enrich/[requestId]` | Poll async enrichment results |
| `POST` | `/api/clay-callback` | Receive Clay webhook payload |
| `POST` | `/api/agent` | Run Mistral pitch strategy agent |
| `POST` | `/api/summarize` | Generate AI creator summary |

## License

MIT
