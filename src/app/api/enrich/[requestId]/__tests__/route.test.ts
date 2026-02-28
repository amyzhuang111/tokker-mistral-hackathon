import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/clay", () => ({
  getEnrichmentResult: vi.fn(),
}));

import { GET } from "../../[requestId]/route";
import { getEnrichmentResult } from "@/lib/clay";
import { NextRequest } from "next/server";

const mockGetResult = vi.mocked(getEnrichmentResult);

function makeRequest(requestId: string) {
  return {
    req: new NextRequest(`http://localhost/api/enrich/${requestId}`),
    params: { params: Promise.resolve({ requestId }) },
  };
}

describe("GET /api/enrich/[requestId]", () => {
  beforeEach(() => {
    mockGetResult.mockReset();
  });

  it("returns 404 when request not found", async () => {
    mockGetResult.mockReturnValue(null);
    const { req, params } = makeRequest("missing-id");
    const res = await GET(req, params);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("returns pending status", async () => {
    mockGetResult.mockReturnValue({ status: "pending", createdAt: Date.now() });
    const { req, params } = makeRequest("pending-id");
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("pending");
  });

  it("returns complete status with data", async () => {
    const data = {
      creator: { handle: "user", followers: "10K", niche: "Tech", avgViews: "5K", topContentThemes: [] },
      brands: [],
    };
    mockGetResult.mockReturnValue({ status: "complete", data, createdAt: Date.now() });
    const { req, params } = makeRequest("complete-id");
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("complete");
    expect(json.creator.handle).toBe("user");
  });
});
