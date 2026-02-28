import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the mistral module before importing clay
vi.mock("../mistral", () => ({
  discoverBrands: vi.fn(),
}));

import {
  normalizeClayResponse,
  createPendingRequest,
  completeRequest,
  getEnrichmentResult,
  triggerClayEnrichment,
} from "../clay";
import { discoverBrands } from "../mistral";

// ─── normalizeClayResponse ───────────────────────────────────────────────────

describe("normalizeClayResponse", () => {
  it("normalizes brands key", () => {
    const raw = {
      brands: [{ name: "Acme", domain: "acme.com" }],
    };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.brands).toHaveLength(1);
    expect(result.brands[0].name).toBe("Acme");
  });

  it("normalizes results key", () => {
    const raw = {
      results: [{ company_name: "BrandCo", website: "brandco.com" }],
    };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.brands).toHaveLength(1);
    expect(result.brands[0].name).toBe("BrandCo");
    expect(result.brands[0].domain).toBe("brandco.com");
  });

  it("normalizes rows key", () => {
    const raw = {
      rows: [{ Company: "RowBrand", Domain: "row.com", Industry: "Tech" }],
    };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.brands[0].name).toBe("RowBrand");
    expect(result.brands[0].domain).toBe("row.com");
    expect(result.brands[0].industry).toBe("Tech");
  });

  it("fills missing fields with defaults", () => {
    const raw = { brands: [{}] };
    const result = normalizeClayResponse(raw, "testuser");
    const b = result.brands[0];
    expect(b.name).toBe("Unknown");
    expect(b.domain).toBe("");
    expect(b.funding).toBe("N/A");
    expect(b.headcount).toBe("N/A");
    expect(b.recentNews).toBe("N/A");
  });

  it("uses nested creator fields when present", () => {
    const raw = {
      creator: { followers: "100K", niche: "Fitness", avgViews: "50K", topContentThemes: ["yoga"] },
      brands: [],
    };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.creator.followers).toBe("100K");
    expect(result.creator.niche).toBe("Fitness");
    expect(result.creator.topContentThemes).toEqual(["yoga"]);
  });

  it("falls back to flat creator fields", () => {
    const raw = { followers: "200K", niche: "Gaming", avg_views: "30K", themes: ["fps"], brands: [] };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.creator.followers).toBe("200K");
    expect(result.creator.niche).toBe("Gaming");
    expect(result.creator.avgViews).toBe("30K");
    expect(result.creator.topContentThemes).toEqual(["fps"]);
  });

  it("coerces fitScore to number", () => {
    const raw = { brands: [{ fit_score: "85" }] };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.brands[0].fitScore).toBe(85);
    expect(typeof result.brands[0].fitScore).toBe("number");
  });

  it("handles empty arrays", () => {
    const raw = { brands: [] };
    const result = normalizeClayResponse(raw, "testuser");
    expect(result.brands).toEqual([]);
    expect(result.creator.handle).toBe("testuser");
  });
});

// ─── In-memory store ─────────────────────────────────────────────────────────

describe("enrichment store", () => {
  beforeEach(() => {
    // Clear any prior state by completing/overwriting with known IDs
    // The store is module-level, so we rely on unique IDs per test
  });

  it("creates a pending request", () => {
    createPendingRequest("test-pending-1");
    const result = getEnrichmentResult("test-pending-1");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("pending");
    expect(result!.data).toBeUndefined();
  });

  it("completes a request with data", () => {
    const data = {
      creator: { handle: "user", followers: "10K", niche: "Tech", avgViews: "5K", topContentThemes: [] },
      brands: [],
    };
    completeRequest("test-complete-1", data);
    const result = getEnrichmentResult("test-complete-1");
    expect(result!.status).toBe("complete");
    expect(result!.data).toEqual(data);
  });

  it("returns null for non-existent request", () => {
    const result = getEnrichmentResult("non-existent-id");
    expect(result).toBeNull();
  });

  it("transitions from pending to complete", () => {
    createPendingRequest("test-transition-1");
    expect(getEnrichmentResult("test-transition-1")!.status).toBe("pending");

    const data = {
      creator: { handle: "user", followers: "10K", niche: "Tech", avgViews: "5K", topContentThemes: [] },
      brands: [],
    };
    completeRequest("test-transition-1", data);
    expect(getEnrichmentResult("test-transition-1")!.status).toBe("complete");
    expect(getEnrichmentResult("test-transition-1")!.data).toEqual(data);
  });
});

// ─── triggerClayEnrichment fallback cascade ──────────────────────────────────

describe("triggerClayEnrichment", () => {
  const mockDiscoverBrands = vi.mocked(discoverBrands);

  beforeEach(() => {
    // Ensure CLAY_WEBHOOK_URL is not set for fallback tests
    vi.stubEnv("CLAY_WEBHOOK_URL", "");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("falls back to Mistral when CLAY_WEBHOOK_URL is not set", async () => {
    const mockData = {
      creator: { handle: "testuser", followers: "50K", niche: "Fitness", avgViews: "20K", topContentThemes: ["workout"] },
      brands: [{ name: "Nike", domain: "nike.com", industry: "Sports", description: "Sportswear", funding: "Public", headcount: "70K+", recentNews: "New campaign", fitScore: 90, fitReason: "Great fit" }],
    };
    mockDiscoverBrands.mockResolvedValue(mockData);

    const result = await triggerClayEnrichment({ tiktok_handle: "testuser" });
    expect(result.mode).toBe("sync");
    if (result.mode === "sync") {
      expect(result.data).toEqual(mockData);
    }
    expect(mockDiscoverBrands).toHaveBeenCalledWith("testuser");
  });

  it("falls back to Mistral when Clay returns 503", async () => {
    vi.stubEnv("CLAY_WEBHOOK_URL", "https://clay.example.com/webhook");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });
    vi.stubGlobal("fetch", mockFetch);

    const mockData = {
      creator: { handle: "testuser", followers: "50K", niche: "Fitness", avgViews: "20K", topContentThemes: ["workout"] },
      brands: [],
    };
    mockDiscoverBrands.mockResolvedValue(mockData);

    const result = await triggerClayEnrichment({ tiktok_handle: "testuser" });
    expect(result.mode).toBe("sync");
    expect(mockDiscoverBrands).toHaveBeenCalled();
  });

  it("falls back to hardcoded mock when both Clay and Mistral fail", async () => {
    vi.stubEnv("CLAY_WEBHOOK_URL", "");
    mockDiscoverBrands.mockRejectedValue(new Error("Mistral API key missing"));

    const result = await triggerClayEnrichment({ tiktok_handle: "testuser" });
    expect(result.mode).toBe("sync");
    if (result.mode === "sync") {
      // Should get hardcoded mock data
      expect(result.data.creator.handle).toBe("testuser");
      expect(result.data.brands.length).toBeGreaterThan(0);
      expect(result.data.brands[0].name).toBe("Alo Yoga"); // from hardcoded mock
    }
  });
});
