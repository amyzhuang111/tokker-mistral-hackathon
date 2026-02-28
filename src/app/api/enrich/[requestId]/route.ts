import { NextRequest, NextResponse } from "next/server";
import { getEnrichmentResult } from "@/lib/clay";

/**
 * Poll for async Clay enrichment results.
 * GET /api/enrich/[requestId]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const result = getEnrichmentResult(requestId);

  if (!result) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  if (result.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  return NextResponse.json({ status: "complete", ...result.data });
}
