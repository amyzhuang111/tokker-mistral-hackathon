import { NextRequest, NextResponse } from "next/server";
import { completeRequest, normalizeClayResponse } from "@/lib/clay";

/**
 * Callback endpoint that Clay POSTs enriched data back to.
 *
 * In your Clay table, add an HTTP API column that POSTs to:
 *   https://your-domain.com/api/clay-callback
 *
 * The request body should include the request_id and enriched fields.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Clay callback error:", err);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}
