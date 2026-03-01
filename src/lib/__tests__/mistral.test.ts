import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so the fn is available when vi.mock factory runs (vi.mock is hoisted)
const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));

vi.mock("@mistralai/mistralai", () => ({
  Mistral: vi.fn().mockImplementation(() => ({
    chat: { complete: mockComplete },
  })),
}));

import { discoverBrands, runAgent } from "../mistral";
import type { CreatorProfile, BrandEnrichment } from "../mistral";

// ─── discoverBrands ──────────────────────────────────────────────────────────

describe("discoverBrands", () => {
  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("parses a valid response", async () => {
    const payload = {
      creator: {
        handle: "fitjenna",
        followers: "100K",
        niche: "Fitness",
        avgViews: "30K",
        topContentThemes: ["workout", "nutrition"],
      },
      brands: [
        {
          name: "Nike",
          domain: "nike.com",
          industry: "Sports",
          description: "Sportswear giant",
          funding: "Public",
          headcount: "70,000+",
          recentNews: "New campaign launch",
          fitScore: 90,
          fitReason: "Perfect audience overlap",
        },
      ],
    };

    mockComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(payload) } }],
    });

    const result = await discoverBrands("fitjenna");
    expect(result.creator.handle).toBe("fitjenna");
    expect(result.creator.niche).toBe("Fitness");
    expect(result.brands).toHaveLength(1);
    expect(result.brands[0].name).toBe("Nike");
    expect(result.brands[0].fitScore).toBe(90);
  });

  it("throws on empty response", async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: "" } }],
    });

    await expect(discoverBrands("testuser")).rejects.toThrow("Mistral returned empty response");
  });

  it("throws on malformed JSON", async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: "not valid json {{{" } }],
    });

    await expect(discoverBrands("testuser")).rejects.toThrow();
  });

  it("returns empty brands array when brands field is missing", async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ creator: { handle: "testuser" } }) } }],
    });

    const result = await discoverBrands("testuser");
    expect(result.brands).toEqual([]);
  });

  it("fills missing fields with defaults", async () => {
    const payload = {
      creator: {},
      brands: [{ name: "Acme" }],
    };
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(payload) } }],
    });

    const result = await discoverBrands("testuser");
    expect(result.creator.handle).toBe("testuser"); // falls back to input handle
    expect(result.creator.followers).toBe("N/A");
    expect(result.creator.niche).toBe("General");
    expect(result.brands[0].funding).toBe("N/A");
    expect(result.brands[0].fitScore).toBe(75);
  });
});

// ─── runAgent (JSON mode — single API call) ──────────────────────────────────

describe("runAgent", () => {
  const creator: CreatorProfile = {
    handle: "fitjenna",
    followers: "100K",
    niche: "Fitness",
    avgViews: "30K",
    topContentThemes: ["workout", "nutrition"],
  };

  const brands: BrandEnrichment[] = [
    {
      name: "Nike",
      domain: "nike.com",
      industry: "Sports",
      description: "Sportswear",
      funding: "Public",
      headcount: "70K+",
      recentNews: "New campaign",
      fitScore: 90,
      fitReason: "Great fit",
    },
  ];

  beforeEach(() => {
    mockComplete.mockReset();
  });

  it("parses JSON response with brand strategies", async () => {
    const responsePayload = {
      overallStrategy: "Focus on fitness brands with high engagement.",
      brandStrategies: [
        {
          brandName: "Nike",
          brandDomain: "nike.com",
          pitchAngle: "Fitness overlap",
          contentFormats: ["product review"],
          talkingPoints: ["audience overlap", "brand values"],
          pitchScript: "Dear Nike...",
          subjectLine: "Partnership opportunity",
          estimatedValue: "$5K-$10K",
        },
      ],
    };

    mockComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(responsePayload) } }],
    });

    const result = await runAgent(creator, brands, "Help me find brand deals");
    expect(result.brandStrategies).toHaveLength(1);
    expect(result.brandStrategies[0].brandName).toBe("Nike");
    expect(result.brandStrategies[0].pitchAngle).toBe("Fitness overlap");
    expect(result.overallStrategy).toBe("Focus on fitness brands with high engagement.");
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it("returns empty strategies when response has no brandStrategies", async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ overallStrategy: "Nothing to do." }) } }],
    });

    const result = await runAgent(creator, brands, "Help me find brand deals");
    expect(result.brandStrategies).toEqual([]);
    expect(result.overallStrategy).toBe("Nothing to do.");
  });

  it("generates fallback overallStrategy when missing from response", async () => {
    const responsePayload = {
      brandStrategies: [
        {
          brandName: "Nike",
          brandDomain: "nike.com",
          pitchAngle: "Fitness overlap",
          contentFormats: ["review"],
          talkingPoints: ["point1"],
          pitchScript: "Script",
          subjectLine: "Subject",
          estimatedValue: "$5K",
        },
      ],
    };

    mockComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(responsePayload) } }],
    });

    const result = await runAgent(creator, brands, "Help me");
    expect(result.brandStrategies).toHaveLength(1);
    // Should have fallback strategy
    expect(result.overallStrategy).toContain("@fitjenna");
    expect(result.overallStrategy).toContain("Nike");
  });

  it("throws on empty response", async () => {
    mockComplete.mockResolvedValue({
      choices: [{ message: { content: "" } }],
    });

    await expect(runAgent(creator, brands, "Test")).rejects.toThrow("Mistral returned empty response");
  });
});
