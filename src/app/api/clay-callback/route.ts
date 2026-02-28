import { NextRequest, NextResponse } from "next/server";
import { completeRequest, normalizeClayResponse } from "@/lib/clay";

/**
 * POST /api/clay-callback
 *
 * Callback endpoint that Clay POSTs enriched data back to.
 *
 * ── Production URL ──────────────────────────────────────────────────
 *   https://tokker-mistral-hackathon.vercel.app/api/clay-callback
 *
 * ── Clay table setup ────────────────────────────────────────────────
 *   1. In your Clay table, add an "HTTP API" action column.
 *   2. Set the method to POST and the URL to the production URL above.
 *   3. In the request body, map these fields from your table columns:
 *
 *      {
 *        "request_id":    "{{request_id}}",
 *        "tiktok_handle": "{{tiktok_handle}}",
 *        "brands": [
 *          {
 *            "name":        "{{Company Name}}",
 *            "domain":      "{{Domain}}",
 *            "industry":    "{{Industry}}",
 *            "description": "{{Description}}",
 *            "funding":     "{{Total Funding}}",
 *            "headcount":   "{{Employee Count}}",
 *            "recent_news": "{{Recent News}}",
 *            "fit_score":   "{{Fit Score}}",
 *            "fit_reason":  "{{Fit Reason}}"
 *          }
 *        ],
 *        "followers":  "{{Followers}}",
 *        "niche":      "{{Niche}}",
 *        "avg_views":  "{{Average Views}}",
 *        "themes":     ["{{Theme 1}}", "{{Theme 2}}"]
 *      }
 *
 *   4. Add a header:  Authorization: Bearer <your CLAY_API_KEY>
 *
 * ── Authentication ──────────────────────────────────────────────────
 *   If CLAY_API_KEY is set, incoming requests must include a matching
 *   Authorization: Bearer <key> header. Requests without a valid key
 *   are rejected with 401.
 */

const CLAY_API_KEY = process.env.CLAY_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Verify the callback is actually from Clay
    if (CLAY_API_KEY) {
      const auth = req.headers.get("authorization");
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token !== CLAY_API_KEY) {
        console.warn("Clay callback rejected — invalid or missing API key");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();

    // Log the raw payload shape for debugging new Clay table configs
    console.log(
      "Clay callback received:",
      JSON.stringify({
        request_id: body.request_id,
        handle: body.tiktok_handle ?? body.handle,
        brandCount: (body.brands ?? body.results ?? body.rows ?? []).length,
        keys: Object.keys(body),
      })
    );

    const requestId = body.request_id;
    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 }
      );
    }

    const handle = body.tiktok_handle ?? body.handle ?? "";
    const result = normalizeClayResponse(body, handle);
    completeRequest(requestId, result);

    console.log(
      `Clay callback completed: requestId=${requestId}, handle=${handle}, brands=${result.brands.length}`
    );

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Clay callback error:", err);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}
