import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

const MODEL = "mistral-large-latest";

export interface CreatorProfile {
  handle: string;
  followers: string;
  niche: string;
  avgViews: string;
  topContentThemes: string[];
}

export interface BrandEnrichment {
  name: string;
  domain: string;
  industry: string;
  description: string;
  funding: string;
  headcount: string;
  recentNews: string;
  fitScore: number;
  fitReason: string;
}

export interface BrandStrategy {
  brandName: string;
  brandDomain: string;
  pitchAngle: string;
  contentFormats: string[];
  talkingPoints: string[];
  pitchScript: string;
  subjectLine: string;
  estimatedValue: string;
}

export interface PRStrategyResult {
  overallStrategy: string;
  brandStrategies: BrandStrategy[];
}

/**
 * Use Mistral to discover contextually relevant brands for a TikTok creator.
 * Infers the creator's likely niche from their handle and generates 5 realistic
 * brand matches — returned in the same shape as Clay enrichment data.
 */
export async function discoverBrands(handle: string): Promise<{
  creator: CreatorProfile;
  brands: BrandEnrichment[];
}> {
  const response = await client.chat.complete({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a brand partnership analyst. Given a TikTok creator's handle, infer their likely niche and audience, then suggest 5 real brands that would be great partnership matches.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "creator": {
    "handle": "<handle>",
    "followers": "<estimated range like 50K-200K>",
    "niche": "<inferred niche>",
    "avgViews": "<estimated avg views>",
    "topContentThemes": ["theme1", "theme2", "theme3"]
  },
  "brands": [
    {
      "name": "Brand Name",
      "domain": "brand.com",
      "industry": "Industry",
      "description": "What the brand does",
      "funding": "Funding info or 'Bootstrapped'",
      "headcount": "Employee range",
      "recentNews": "Recent relevant news",
      "fitScore": 85,
      "fitReason": "Why this creator and brand are a good match"
    }
  ]
}

Rules:
- Use REAL brands that actually exist — do not invent fictional companies
- Infer the niche creatively from the handle name (e.g. "fitjenna" → fitness, "chloecooks" → food/cooking)
- If the handle is ambiguous, pick a plausible niche and go with it
- Fit scores should range from 70-95 and vary realistically
- Fit reasons should reference the creator's likely content style and the brand's marketing strategy
- Include a mix of well-known and emerging brands
- Make funding, headcount, and news realistic but not necessarily exact`,
      },
      {
        role: "user",
        content: `TikTok handle: @${handle}`,
      },
    ],
    responseFormat: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Mistral returned empty response");

  const parsed = JSON.parse(typeof content === "string" ? content : String(content));

  // Normalize into our expected shapes
  return {
    creator: {
      handle: parsed.creator?.handle ?? handle,
      followers: parsed.creator?.followers ?? "N/A",
      niche: parsed.creator?.niche ?? "General",
      avgViews: parsed.creator?.avgViews ?? "N/A",
      topContentThemes: parsed.creator?.topContentThemes ?? [],
    },
    brands: (parsed.brands ?? []).map((b: Record<string, unknown>) => ({
      name: String(b.name ?? "Unknown"),
      domain: String(b.domain ?? ""),
      industry: String(b.industry ?? ""),
      description: String(b.description ?? ""),
      funding: String(b.funding ?? "N/A"),
      headcount: String(b.headcount ?? "N/A"),
      recentNews: String(b.recentNews ?? "N/A"),
      fitScore: Number(b.fitScore ?? 75),
      fitReason: String(b.fitReason ?? ""),
    })),
  };
}

/**
 * Run the Mistral PR strategy agent in a single API call.
 *
 * Uses JSON response mode instead of a sequential tool-calling loop,
 * reducing latency from 6+ round trips to just 1.
 */
export async function runAgent(
  creator: CreatorProfile,
  brands: BrandEnrichment[],
  marketingRequest: string
): Promise<PRStrategyResult> {
  const brandList = brands
    .map(
      (b) =>
        `- ${b.name} (${b.domain}) | Industry: ${b.industry} | Funding: ${b.funding} | Headcount: ${b.headcount} | Recent: ${b.recentNews} | Fit Score: ${b.fitScore} | Fit Reason: ${b.fitReason} | Description: ${b.description}`
    )
    .join("\n");

  const response = await client.chat.complete({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are Tokker, an expert AI PR agent for TikTok creators. Craft hyper-personalized brand outreach strategies.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "overallStrategy": "2-3 paragraph executive summary covering positioning, target verticals, outreach timeline, and expected outcomes.",
  "brandStrategies": [
    {
      "brandName": "Brand Name",
      "brandDomain": "brand.com",
      "pitchAngle": "Primary angle for why this partnership works — reference specific enrichment data points.",
      "contentFormats": ["format1", "format2"],
      "talkingPoints": ["point1", "point2", "point3"],
      "pitchScript": "Ready-to-send 2-3 paragraph pitch from the creator to the brand's marketing team. Professional but personal.",
      "subjectLine": "Email subject line for outreach",
      "estimatedValue": "$X,XXX - $XX,XXX"
    }
  ]
}

Rules:
- Generate a strategy for EVERY brand in the enrichment data
- Reference specific data points (funding, hiring signals, recent news) in each pitch
- Each pitch should feel deeply researched — avoid generic advice
- Pitch scripts should be ready to copy-paste into an email
- Estimated values should be realistic for the creator's audience size
- Content formats should match the creator's existing content style`,
      },
      {
        role: "user",
        content: `## Creator Profile
- Handle: @${creator.handle}
- Followers: ${creator.followers}
- Niche: ${creator.niche}
- Average Views: ${creator.avgViews}
- Top Content Themes: ${creator.topContentThemes.join(", ")}

## Creator's Marketing Request
${marketingRequest}

## Enriched Brand Matches (from Clay)
${brandList}`,
      },
    ],
    responseFormat: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Mistral returned empty response");

  const parsed = JSON.parse(typeof content === "string" ? content : String(content));

  const brandStrategies: BrandStrategy[] = (parsed.brandStrategies ?? []).map(
    (s: Record<string, unknown>) => ({
      brandName: String(s.brandName ?? "Unknown"),
      brandDomain: String(s.brandDomain ?? ""),
      pitchAngle: String(s.pitchAngle ?? ""),
      contentFormats: Array.isArray(s.contentFormats) ? s.contentFormats.map(String) : [],
      talkingPoints: Array.isArray(s.talkingPoints) ? s.talkingPoints.map(String) : [],
      pitchScript: String(s.pitchScript ?? ""),
      subjectLine: String(s.subjectLine ?? ""),
      estimatedValue: String(s.estimatedValue ?? ""),
    })
  );

  const overallStrategy =
    String(parsed.overallStrategy ?? "") ||
    `PR strategy generated for @${creator.handle} targeting ${brandStrategies.length} brands across ${[...new Set(brandStrategies.map((b) => b.brandName))].join(", ")}.`;

  return { overallStrategy, brandStrategies };
}
