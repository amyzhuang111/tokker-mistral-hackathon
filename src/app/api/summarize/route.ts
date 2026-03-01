import { NextRequest, NextResponse } from "next/server";
import { summarizeCreator } from "@/lib/mistral";
import type { ClayCreator } from "@/lib/clay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const creator = body.creator as ClayCreator | undefined;

    if (!creator?.handle) {
      return NextResponse.json(
        { error: "Missing creator data" },
        { status: 400 }
      );
    }

    const summary = await summarizeCreator(creator);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summarize failed" },
      { status: 500 }
    );
  }
}
