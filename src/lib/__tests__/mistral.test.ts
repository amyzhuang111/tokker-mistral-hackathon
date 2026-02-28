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

// ─── runAgent ────────────────────────────────────────────────────────────────

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

  it("processes tool calls for analyze and compile", async () => {
    // First call: model returns analyze_creator_brand_fit tool call
    mockComplete.mockResolvedValueOnce({
      choices: [{
        message: {
          content: "",
          toolCalls: [{
            id: "call_1",
            function: {
              name: "analyze_creator_brand_fit",
              arguments: JSON.stringify({
                brand_name: "Nike",
                brand_domain: "nike.com",
                pitch_angle: "Fitness overlap",
                content_formats: ["product review"],
                talking_points: ["audience overlap", "brand values"],
                pitch_script: "Dear Nike...",
                subject_line: "Partnership opportunity",
                estimated_value: "$5K-$10K",
              }),
            },
          }],
        },
        finishReason: "tool_calls",
      }],
    });

    // Second call: model returns compile_pr_strategy tool call
    mockComplete.mockResolvedValueOnce({
      choices: [{
        message: {
          content: "",
          toolCalls: [{
            id: "call_2",
            function: {
              name: "compile_pr_strategy",
              arguments: JSON.stringify({
                overall_strategy: "Focus on fitness brands with high engagement.",
              }),
            },
          }],
        },
        finishReason: "tool_calls",
      }],
    });

    // Third call: model returns stop (no more tool calls)
    mockComplete.mockResolvedValueOnce({
      choices: [{
        message: { content: "Done!", toolCalls: [] },
        finishReason: "stop",
      }],
    });

    const result = await runAgent(creator, brands, "Help me find brand deals");
    expect(result.brandStrategies).toHaveLength(1);
    expect(result.brandStrategies[0].brandName).toBe("Nike");
    expect(result.brandStrategies[0].pitchAngle).toBe("Fitness overlap");
    expect(result.overallStrategy).toBe("Focus on fitness brands with high engagement.");
  });

  it("returns empty strategies when model returns no tool calls", async () => {
    mockComplete.mockResolvedValue({
      choices: [{
        message: { content: "No tools needed.", toolCalls: [] },
        finishReason: "stop",
      }],
    });

    const result = await runAgent(creator, brands, "Help me find brand deals");
    expect(result.brandStrategies).toEqual([]);
  });

  it("generates fallback strategy when no compile tool call is made", async () => {
    // Model only calls analyze, never calls compile
    mockComplete.mockResolvedValueOnce({
      choices: [{
        message: {
          content: "",
          toolCalls: [{
            id: "call_1",
            function: {
              name: "analyze_creator_brand_fit",
              arguments: JSON.stringify({
                brand_name: "Nike",
                brand_domain: "nike.com",
                pitch_angle: "Fitness overlap",
                content_formats: ["review"],
                talking_points: ["point1"],
                pitch_script: "Script",
                subject_line: "Subject",
                estimated_value: "$5K",
              }),
            },
          }],
        },
        finishReason: "tool_calls",
      }],
    });

    // Second call: stop without compile
    mockComplete.mockResolvedValueOnce({
      choices: [{
        message: { content: "All done", toolCalls: [] },
        finishReason: "stop",
      }],
    });

    const result = await runAgent(creator, brands, "Help me");
    expect(result.brandStrategies).toHaveLength(1);
    // Should have fallback strategy since compile was never called
    expect(result.overallStrategy).toContain("@fitjenna");
    expect(result.overallStrategy).toContain("Nike");
  });

  it("exits safely after max iterations", async () => {
    // Always return a tool call — agent should stop after 15 iterations
    mockComplete.mockResolvedValue({
      choices: [{
        message: {
          content: "",
          toolCalls: [{
            id: "call_loop",
            function: {
              name: "analyze_creator_brand_fit",
              arguments: JSON.stringify({
                brand_name: "Infinite",
                brand_domain: "loop.com",
                pitch_angle: "Looping",
                content_formats: ["loop"],
                talking_points: ["point"],
                pitch_script: "Script",
                subject_line: "Subject",
                estimated_value: "$0",
              }),
            },
          }],
        },
        finishReason: "tool_calls",
      }],
    });

    const result = await runAgent(creator, brands, "Loop forever");
    // Should have collected 15 brand strategies (one per iteration)
    expect(result.brandStrategies).toHaveLength(15);
    expect(mockComplete).toHaveBeenCalledTimes(15);
  });
});
