import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mistral", () => ({
  runAgent: vi.fn(),
}));

import { POST } from "../route";
import { runAgent } from "@/lib/mistral";
import { NextRequest } from "next/server";

const mockRunAgent = vi.mocked(runAgent);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  creator: { handle: "fitjenna", followers: "100K", niche: "Fitness", avgViews: "30K", topContentThemes: ["workout"] },
  brands: [{ name: "Nike", domain: "nike.com", industry: "Sports", description: "Sportswear", funding: "Public", headcount: "70K+", recentNews: "New launch", fitScore: 90, fitReason: "Good fit" }],
  marketingRequest: "Help me get brand deals",
};

describe("POST /api/agent", () => {
  beforeEach(() => {
    mockRunAgent.mockReset();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ creator: validBody.creator }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing required fields/i);
  });

  it("returns agent result on success", async () => {
    const agentResult = {
      overallStrategy: "Focus on fitness brands.",
      brandStrategies: [{
        brandName: "Nike",
        brandDomain: "nike.com",
        pitchAngle: "Fitness overlap",
        contentFormats: ["review"],
        talkingPoints: ["point1"],
        pitchScript: "Dear Nike...",
        subjectLine: "Partnership",
        estimatedValue: "$5K",
      }],
    };
    mockRunAgent.mockResolvedValue(agentResult);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overallStrategy).toBe("Focus on fitness brands.");
    expect(json.brandStrategies).toHaveLength(1);
  });

  it("returns 500 on error", async () => {
    mockRunAgent.mockRejectedValue(new Error("Agent crashed"));

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Agent crashed");
  });
});
