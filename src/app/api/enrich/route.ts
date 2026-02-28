import { NextRequest, NextResponse } from "next/server";
import { triggerClayEnrichment } from "@/lib/clay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const handle = body.handle?.trim();

    if (!handle) {
      return NextResponse.json(
        { error: "Missing TikTok handle" },
        { status: 400 }
      );
    }

    const result = await triggerClayEnrichment({
      tiktok_handle: handle,
      niche_description: body.niche_description,
    });

    if (result.mode === "sync") {
      // Clay returned data immediately (mock data or sync webhook)
      return NextResponse.json({ status: "complete", ...result.data });
    }

    // Async mode — client should poll /api/enrich/[requestId]
    return NextResponse.json({
      status: "pending",
      requestId: result.requestId,
    });
  } catch (err) {
    console.error("Enrichment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Enrichment failed" },
      { status: 500 }
    );
  }
}
