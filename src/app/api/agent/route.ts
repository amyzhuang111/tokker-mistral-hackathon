import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/mistral";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { creator, brands, marketingRequest } = body;

    if (!creator || !brands || !marketingRequest) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: creator, brands, and marketingRequest",
        },
        { status: 400 }
      );
    }

    const result = await runAgent(creator, brands, marketingRequest);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent failed" },
      { status: 500 }
    );
  }
}
