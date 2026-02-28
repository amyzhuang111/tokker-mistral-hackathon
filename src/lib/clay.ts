/**
 * Clay webhook integration.
 *
 * Clay doesn't have a traditional REST API — it's table-based.
 * Integration path:
 *   1. Push data into a Clay table via its webhook URL
 *   2. Clay runs enrichment columns (100+ data providers)
 *   3. Pull enriched data back via HTTP action or return webhook
 *
 * For the hackathon we pre-configure a Clay table with enrichment columns
 * (company funding, headcount, job postings, tech stack) and expose it as
 * a webhook endpoint.
 */

const CLAY_WEBHOOK_URL = process.env.CLAY_WEBHOOK_URL;

export interface ClayEnrichmentInput {
  tiktok_handle: string;
  /** Optional additional context the creator provided */
  niche_description?: string;
}

export interface ClayEnrichmentResult {
  creator: {
    handle: string;
    followers: string;
    niche: string;
    avgViews: string;
    topContentThemes: string[];
  };
  brands: Array<{
    name: string;
    domain: string;
    industry: string;
    description: string;
    funding: string;
    headcount: string;
    recentNews: string;
    fitScore: number;
    fitReason: string;
  }>;
}

/**
 * Trigger Clay enrichment for a TikTok creator.
 * Posts the handle to the Clay webhook and returns enriched data.
 */
export async function triggerClayEnrichment(
  input: ClayEnrichmentInput
): Promise<ClayEnrichmentResult> {
  if (!CLAY_WEBHOOK_URL) {
    console.warn("CLAY_WEBHOOK_URL not set — returning mock data");
    return getMockEnrichment(input.tiktok_handle);
  }

  const res = await fetch(CLAY_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tiktok_handle: input.tiktok_handle,
      niche_description: input.niche_description ?? "",
    }),
  });

  if (!res.ok) {
    throw new Error(`Clay webhook returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data as ClayEnrichmentResult;
}

/**
 * Mock data for development / demo when Clay webhook isn't configured.
 */
function getMockEnrichment(handle: string): ClayEnrichmentResult {
  return {
    creator: {
      handle,
      followers: "127K",
      niche: "Fitness & Wellness",
      avgViews: "45K",
      topContentThemes: [
        "Workout routines",
        "Healthy recipes",
        "Morning rituals",
      ],
    },
    brands: [
      {
        name: "Alo Yoga",
        domain: "aloyoga.com",
        industry: "Athletic Wear",
        description:
          "Premium yoga and athleisure brand targeting mindful fitness enthusiasts.",
        funding: "Series C — $100M (2024)",
        headcount: "500–1,000",
        recentNews: "Expanding DTC influencer program",
        fitScore: 92,
        fitReason:
          "High overlap between your fitness audience and Alo's target demographic. They're actively scaling their creator program and your workout content style matches their brand aesthetic.",
      },
      {
        name: "AG1 (Athletic Greens)",
        domain: "drinkag1.com",
        industry: "Health Supplements",
        description:
          "Daily nutritional supplement with strong creator marketing presence.",
        funding: "Series D — $115M (2023)",
        headcount: "200–500",
        recentNews: "Hiring 3 influencer marketing managers",
        fitScore: 88,
        fitReason:
          "AG1 is one of the top spenders on influencer marketing in health/wellness. Your healthy recipe content provides a natural product integration point.",
      },
      {
        name: "Hyperice",
        domain: "hyperice.com",
        industry: "Recovery Tech",
        description:
          "High-performance recovery devices for athletes and fitness enthusiasts.",
        funding: "Series B — $48M (2023)",
        headcount: "100–200",
        recentNews: "Launched new consumer product line",
        fitScore: 81,
        fitReason:
          "Your workout content audience cares about recovery. Hyperice is expanding from pro sports into the creator/enthusiast market — your niche fits their go-to-market.",
      },
      {
        name: "Bloom Nutrition",
        domain: "bloomnu.com",
        industry: "Supplements / DTC",
        description:
          "Gen-Z focused greens and supplement brand built on TikTok virality.",
        funding: "Bootstrapped — $100M+ revenue",
        headcount: "50–100",
        recentNews: "TikTok Shop top seller, expanding ambassador program",
        fitScore: 85,
        fitReason:
          "Bloom is native to TikTok and actively recruits fitness creators with 50K–200K followers. Your audience size and content style are a direct match.",
      },
      {
        name: "Vuori",
        domain: "vuoriclothing.com",
        industry: "Performance Apparel",
        description:
          "Premium performance apparel for an active lifestyle.",
        funding: "SoftBank investment at $4B valuation (2021)",
        headcount: "1,000+",
        recentNews: "Scaling influencer partnerships for 2025",
        fitScore: 76,
        fitReason:
          "Vuori targets active lifestyle consumers and is increasing influencer spend. Your content aligns with their brand, though competition for partnerships is higher.",
      },
    ],
  };
}
