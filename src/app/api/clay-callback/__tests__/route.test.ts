import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/clay", () => ({
  normalizeClayResponse: vi.fn(),
  completeRequest: vi.fn(),
}));

import { POST } from "../route";
import { normalizeClayResponse, completeRequest } from "@/lib/clay";
import { NextRequest } from "next/server";

const mockNormalize = vi.mocked(normalizeClayResponse);
const mockComplete = vi.mocked(completeRequest);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/clay-callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/clay-callback", () => {
  beforeEach(() => {
    mockNormalize.mockReset();
    mockComplete.mockReset();
  });

  it("returns 400 when request_id is missing", async () => {
    const res = await POST(makeRequest({ tiktok_handle: "testuser" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing request_id/i);
  });

  it("normalizes and stores data on valid callback", async () => {
    const normalizedData = {
      creator: { handle: "testuser", followers: "50K", niche: "Tech", avgViews: "20K", topContentThemes: [] },
      brands: [],
    };
    mockNormalize.mockReturnValue(normalizedData);

    const res = await POST(makeRequest({
      request_id: "req-123",
      tiktok_handle: "testuser",
      brands: [{ name: "Acme" }],
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(mockNormalize).toHaveBeenCalled();
    expect(mockComplete).toHaveBeenCalledWith("req-123", normalizedData);
  });

  it("returns 500 on processing error", async () => {
    mockNormalize.mockImplementation(() => {
      throw new Error("Parse failed");
    });

    const res = await POST(makeRequest({
      request_id: "req-456",
      tiktok_handle: "testuser",
    }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Callback processing failed/i);
  });
});
