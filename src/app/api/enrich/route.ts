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

    const enrichment = await triggerClayEnrichment({
      tiktok_handle: handle,
      niche_description: body.niche_description,
    });

    return NextResponse.json(enrichment);
  } catch (err) {
    console.error("Enrichment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Enrichment failed" },
      { status: 500 }
    );
  }
}
