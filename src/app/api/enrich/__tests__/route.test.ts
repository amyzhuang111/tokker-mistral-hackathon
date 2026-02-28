import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/clay", () => ({
  triggerClayEnrichment: vi.fn(),
}));

import { POST } from "../route";
import { triggerClayEnrichment } from "@/lib/clay";
import { NextRequest } from "next/server";

const mockTrigger = vi.mocked(triggerClayEnrichment);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/enrich", () => {
  beforeEach(() => {
    mockTrigger.mockReset();
  });

  it("returns 400 when handle is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing TikTok handle/i);
  });

  it("returns sync data when mode is sync", async () => {
    const mockData = {
      creator: { handle: "testuser", followers: "50K", niche: "Tech", avgViews: "20K", topContentThemes: [] },
      brands: [],
    };
    mockTrigger.mockResolvedValue({ mode: "sync", data: mockData });

    const res = await POST(makeRequest({ handle: "testuser" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("complete");
    expect(json.creator.handle).toBe("testuser");
  });

  it("returns pending status when mode is async", async () => {
    mockTrigger.mockResolvedValue({ mode: "async", requestId: "req-123" });

    const res = await POST(makeRequest({ handle: "testuser" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("pending");
    expect(json.requestId).toBe("req-123");
  });

  it("returns 500 on error", async () => {
    mockTrigger.mockRejectedValue(new Error("Something broke"));

    const res = await POST(makeRequest({ handle: "testuser" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Something broke");
  });
});
