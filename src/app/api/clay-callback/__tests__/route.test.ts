import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/clay", () => ({
  normalizeClayResponse: vi.fn(),
  completeRequest: vi.fn(),
}));

import { normalizeClayResponse, completeRequest } from "@/lib/clay";
import { NextRequest } from "next/server";

const mockNormalize = vi.mocked(normalizeClayResponse);
const mockComplete = vi.mocked(completeRequest);

function makeRequest(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost/api/clay-callback", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/clay-callback", () => {
  beforeEach(() => {
    mockNormalize.mockReset();
    mockComplete.mockReset();
    vi.resetModules();
  });

  it("returns 200 with warning when request_id is missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ tiktok_handle: "testuser" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warning).toMatch(/No request_id/i);
  });

  it("normalizes and stores data on valid callback", async () => {
    const normalizedData = {
      creator: { handle: "testuser", followers: "50K", niche: "Tech", avgViews: "20K", topContentThemes: [] },
      brands: [],
    };
    mockNormalize.mockReturnValue(normalizedData);

    const { POST } = await import("../route");
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

  it("returns 200 even on processing error (permissive)", async () => {
    mockNormalize.mockImplementation(() => {
      throw new Error("Parse failed");
    });

    const { POST } = await import("../route");
    const res = await POST(makeRequest({
      request_id: "req-456",
      tiktok_handle: "testuser",
    }));

    // Permissive — always 200
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("returns 200 with warning when API key mismatches", async () => {
    vi.stubEnv("CLAY_API_KEY", "secret-key");
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ request_id: "req-789" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warning).toMatch(/API key mismatch/i);
    vi.unstubAllEnvs();
  });

  it("accepts request when auth header matches CLAY_API_KEY", async () => {
    vi.stubEnv("CLAY_API_KEY", "secret-key");
    mockNormalize.mockReturnValue({
      creator: { handle: "u", followers: "", niche: "", avgViews: "", topContentThemes: [] },
      brands: [],
    });

    const { POST } = await import("../route");
    const res = await POST(makeRequest(
      { request_id: "req-auth", tiktok_handle: "u" },
      { Authorization: "Bearer secret-key" },
    ));
    expect(res.status).toBe(200);
    vi.unstubAllEnvs();
  });
});
