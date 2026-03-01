/**
 * Clay webhook integration.
 *
 * Clay doesn't have a traditional REST API — it's table-based.
 * Integration flow:
 *   1. POST creator data to Clay webhook URL → adds a row to the table
 *   2. Clay runs enrichment columns (100+ data providers) — async
 *   3. Clay POSTs enriched data back to our callback endpoint (/api/clay-callback)
 *   4. Frontend polls /api/enrich/[requestId] until results arrive
 *
 * Pre-configure your Clay table with:
 *   - A Webhook source (gives you the inbound webhook URL)
 *   - Enrichment columns (company funding, headcount, job postings, tech stack)
 *   - An HTTP API column that POSTs results back to your server's callback URL
 */

import { randomUUID } from "crypto";
import { discoverBrands } from "./mistral";

const CLAY_WEBHOOK_URL = process.env.CLAY_WEBHOOK_URL;
const CLAY_API_KEY = process.env.CLAY_API_KEY;
const CALLBACK_BASE_URL =
  process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.CALLBACK_BASE_URL ?? "http://localhost:3000";

export interface ClayEnrichmentInput {
  tiktok_handle: string;
  niche_description?: string;
}

/** Sanitize handle input — accept "@handle", bare handle, or full TikTok URL */
function extractHandle(input: string): string {
  const trimmed = input.trim();
  // Full URL: https://www.tiktok.com/@handle?lang=en
  const urlMatch = trimmed.match(/tiktok\.com\/@([^?/]+)/);
  if (urlMatch) return urlMatch[1];
  // Strip leading @
  return trimmed.replace(/^@/, "");
}

export interface ClayBrand {
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

export interface AudienceBucket {
  code: string;
  name?: string;
  weight: number;
}

export interface ContactInfo {
  type: string;
  value: string;
}

export interface ClayCreator {
  handle: string;
  followers: string;
  niche: string;
  avgViews: string;
  topContentThemes: string[];
  // Modash-enriched fields (optional — populated when Clay returns them)
  fullname?: string;
  picture?: string;
  bio?: string;
  email?: string;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  totalLikes?: number;
  postsCount?: number;
  gender?: string;
  country?: string;
  city?: string;
  ageGroup?: string;
  isVerified?: boolean;
  contacts?: ContactInfo[];
  paidPostPerformance?: number;
  sponsoredPostsMedianViews?: number;
  nonSponsoredPostsMedianViews?: number;
  hashtags?: { tag: string; weight: number }[];
  audienceGenders?: AudienceBucket[];
  audienceAges?: AudienceBucket[];
  audienceCountries?: AudienceBucket[];
  audienceLanguages?: AudienceBucket[];
}

export interface ClayEnrichmentResult {
  creator: ClayCreator;
  brands: ClayBrand[];
}

/**
 * In-memory store for async enrichment results.
 * Keyed by request ID. In production you'd use Redis or a DB.
 */
const enrichmentStore = new Map<
  string,
  { status: "pending" | "complete"; data?: ClayEnrichmentResult; createdAt: number }
>();

/** Store a pending request */
export function createPendingRequest(requestId: string) {
  enrichmentStore.set(requestId, { status: "pending", createdAt: Date.now() });
}

/** Store completed enrichment data from Clay callback */
export function completeRequest(requestId: string, data: ClayEnrichmentResult) {
  enrichmentStore.set(requestId, { status: "complete", data, createdAt: Date.now() });
}

/** Get enrichment result by request ID */
export function getEnrichmentResult(requestId: string) {
  return enrichmentStore.get(requestId) ?? null;
}

/** Clean up old entries (older than 30 min) */
function cleanupStore() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, val] of enrichmentStore) {
    if (val.createdAt < cutoff) enrichmentStore.delete(key);
  }
}

/**
 * Trigger Clay enrichment for a TikTok creator.
 *
 * - If CLAY_WEBHOOK_URL is set: POSTs to Clay webhook with a request_id.
 *   Clay enriches async and POSTs results back to /api/clay-callback.
 *   Returns { requestId } for polling.
 *
 * - If CLAY_WEBHOOK_URL is not set: returns mock data immediately.
 */
export async function triggerClayEnrichment(
  input: ClayEnrichmentInput
): Promise<{ mode: "async"; requestId: string } | { mode: "sync"; data: ClayEnrichmentResult }> {
  cleanupStore();

  const handle = extractHandle(input.tiktok_handle);
  const tiktokUrl = `https://www.tiktok.com/@${handle}`;

  if (!CLAY_WEBHOOK_URL) {
    console.log("CLAY_WEBHOOK_URL not set — using Mistral brand discovery");
    return mistralFallback(handle);
  }

  const requestId = randomUUID();
  createPendingRequest(requestId);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (CLAY_API_KEY) {
      headers["Authorization"] = `Bearer ${CLAY_API_KEY}`;
    }

    const res = await fetch(CLAY_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        request_id: requestId,
        tiktok_handle: handle,
        tiktok_url: tiktokUrl,
        niche_description: input.niche_description ?? "",
        callback_url: `${CALLBACK_BASE_URL}/api/clay-callback`,
      }),
    });

    if (!res.ok) {
      enrichmentStore.delete(requestId);
      console.warn(`Clay webhook returned ${res.status} — falling back to Mistral`);
      return mistralFallback(handle);
    }

    // Some Clay setups return enriched data synchronously in the response
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const responseData = await res.json();
        // If Clay returned full enrichment data inline, use it directly
        if (responseData.creator && responseData.brands) {
          const result = responseData as ClayEnrichmentResult;
          completeRequest(requestId, result);
          return { mode: "sync", data: result };
        }
        // If Clay returned partial data or just an ack, check for enriched fields
        if (responseData.brands || responseData.results) {
          const result = normalizeClayResponse(responseData, handle);
          completeRequest(requestId, result);
          return { mode: "sync", data: result };
        }
      } catch {
        // Response wasn't valid JSON enrichment data — continue with async
      }
    }

    // Async mode: Clay will POST results back to /api/clay-callback
    return { mode: "async", requestId };
  } catch (err) {
    enrichmentStore.delete(requestId);
    console.warn("Clay webhook failed — falling back to Mistral:", err);
    return mistralFallback(handle);
  }
}

/** Safely coerce to number or return undefined */
function toNum(val: unknown): number | undefined {
  if (val == null) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

/** Format a number as a compact string (294300 → "294.3K") */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Normalize various Clay response shapes into our standard format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeClayResponse(raw: any, handle: string): ClayEnrichmentResult {
  const brands: ClayBrand[] = [];
  const rawBrands = raw.brands ?? raw.results ?? raw.rows ?? [];

  for (const b of rawBrands) {
    brands.push({
      name: b.name ?? b.company_name ?? b.Company ?? "Unknown",
      domain: b.domain ?? b.website ?? b.Domain ?? "",
      industry: b.industry ?? b.Industry ?? b.vertical ?? "",
      description: b.description ?? b.Description ?? b.about ?? "",
      funding: b.funding ?? b.total_funding ?? b.Funding ?? "N/A",
      headcount: b.headcount ?? b.employee_count ?? b.Headcount ?? "N/A",
      recentNews: b.recent_news ?? b.recentNews ?? b.news ?? "N/A",
      fitScore: Number(b.fit_score ?? b.fitScore ?? b.score ?? 70),
      fitReason: b.fit_reason ?? b.fitReason ?? b.reason ?? "",
    });
  }

  // Clay sends Modash data under `influencer_data` (or `influencer_details`)
  const inf = raw.influencer_data ?? raw.influencer_details ?? raw.influencerDetails ?? {};
  const profile = inf.profile ?? {};
  const audience = inf.audience ?? {};
  const c = raw.creator ?? {};

  // Format follower count nicely (294300 → "294.3K")
  const rawFollowers = c.followers ?? profile.followers ?? profile.followersCount ?? inf.followers ?? raw.followers;
  const followersStr = typeof rawFollowers === "number" ? formatCount(rawFollowers) : (rawFollowers ?? "N/A");

  const rawAvgViews = c.avgViews ?? profile.averageViews ?? profile.avgViews ?? inf.avgViews ?? raw.avg_views;
  const avgViewsStr = typeof rawAvgViews === "number" ? formatCount(rawAvgViews) : (rawAvgViews ?? "N/A");

  // Extract hashtags as content themes if available
  const hashtags: { tag: string; weight: number }[] = Array.isArray(inf.hashtags) ? inf.hashtags : [];
  const topThemes = c.topContentThemes
    ?? raw.themes
    ?? (audience.interests?.length ? audience.interests.map((i: { name?: string }) => i.name).filter(Boolean) : undefined)
    ?? (hashtags.length ? hashtags.slice(0, 5).map((h) => h.tag) : []);

  // Normalize contacts from [{type, value}] format
  const rawContacts = inf.contacts ?? raw.contacts;
  const contacts: ContactInfo[] | undefined = Array.isArray(rawContacts)
    ? rawContacts.map((c: { type?: string; value?: string }) => ({
        type: c.type ?? "other",
        value: c.value ?? "",
      }))
    : undefined;

  const creator: ClayCreator = {
    handle: handle || profile.username || inf.handle || "",
    followers: followersStr,
    niche: c.niche ?? raw.niche ?? (hashtags.length ? hashtags[0].tag : "N/A"),
    avgViews: avgViewsStr,
    topContentThemes: topThemes,
    // Modash profile fields
    fullname: c.fullname ?? profile.fullname ?? inf.fullname ?? undefined,
    picture: profile.picture ?? inf.picture ?? undefined,
    bio: c.bio ?? inf.bio ?? profile.bio ?? raw.bio ?? undefined,
    email: inf.email ?? raw.email ?? contacts?.find((c) => c.type === "email")?.value ?? undefined,
    engagementRate: toNum(profile.engagementRate ?? profile.engagement_rate ?? inf.engagementRate),
    avgLikes: toNum(inf.avgLikes ?? profile.avgLikes ?? raw.avgLikes),
    avgComments: toNum(inf.avgComments ?? profile.avgComments ?? raw.avgComments),
    totalLikes: toNum(inf.totalLikes ?? profile.totalLikes ?? raw.totalLikes),
    postsCount: toNum(inf.postsCount ?? profile.postsCount ?? raw.postsCount),
    gender: inf.gender ?? profile.gender ?? raw.gender ?? undefined,
    country: inf.country ?? profile.country ?? raw.country ?? undefined,
    city: inf.city ?? profile.city ?? raw.city ?? undefined,
    ageGroup: inf.ageGroup ?? raw.ageGroup ?? undefined,
    isVerified: inf.isVerified ?? profile.isVerified ?? raw.isVerified ?? undefined,
    contacts,
    paidPostPerformance: toNum(inf.paidPostPerformance ?? raw.paidPostPerformance),
    sponsoredPostsMedianViews: toNum(inf.sponsoredPostsMedianViews ?? raw.sponsoredPostsMedianViews),
    nonSponsoredPostsMedianViews: toNum(inf.nonSponsoredPostsMedianViews ?? raw.nonSponsoredPostsMedianViews),
    hashtags: hashtags.length ? hashtags : undefined,
    audienceGenders: Array.isArray(audience.genders) ? audience.genders : undefined,
    audienceAges: Array.isArray(audience.ages) ? audience.ages : undefined,
    audienceCountries: Array.isArray(audience.geoCountries) ? audience.geoCountries : undefined,
    audienceLanguages: Array.isArray(audience.languages) ? audience.languages : undefined,
  };

  return { creator, brands };
}

/**
 * Fallback: use Mistral to generate contextual brand matches.
 * If Mistral also fails (e.g., no API key), fall back to hardcoded mock.
 */
async function mistralFallback(
  handle: string
): Promise<{ mode: "sync"; data: ClayEnrichmentResult }> {
  try {
    const result = await discoverBrands(handle);
    return { mode: "sync", data: result };
  } catch (err) {
    console.warn("Mistral brand discovery failed — using hardcoded mock:", err);
    return { mode: "sync", data: getMockEnrichment(handle) };
  }
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
