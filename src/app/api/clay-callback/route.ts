import { NextRequest, NextResponse } from "next/server";
import { completeRequest, normalizeClayResponse } from "@/lib/clay";

const CLAY_API_KEY = process.env.CLAY_API_KEY;

/** In-memory log of the last 20 raw payloads received (for /api/clay-callback GET debug UI) */
const recentPayloads: { receivedAt: string; body: unknown }[] = [];

export async function POST(req: NextRequest) {
  try {
    if (CLAY_API_KEY) {
      const auth = req.headers.get("authorization");
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token !== CLAY_API_KEY) {
        console.warn("Clay callback rejected — invalid or missing API key");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();

    // Log the FULL raw payload
    console.log("Clay callback RAW payload:", JSON.stringify(body, null, 2));

    // Store for the debug GET endpoint
    recentPayloads.unshift({ receivedAt: new Date().toISOString(), body });
    if (recentPayloads.length > 20) recentPayloads.pop();

    const requestId = body.request_id;
    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request_id", received: body },
        { status: 400 }
      );
    }

    const handle = body.tiktok_handle ?? body.handle ?? "";
    const result = normalizeClayResponse(body, handle);
    completeRequest(requestId, result);

    return NextResponse.json({ status: "ok", received: body });
  } catch (err) {
    console.error("Clay callback error:", err);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}

/** GET /api/clay-callback — debug page showing recent raw payloads */
export async function GET() {
  if (recentPayloads.length === 0) {
    const html = `<!DOCTYPE html><html><head><title>Clay Callback Debug</title></head>
<body style="background:#111;color:#eee;font-family:monospace;padding:2rem">
<h2>Clay Callback Debug</h2>
<p>No payloads received yet. POST to this endpoint from Clay and refresh.</p>
</body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }

  const rows = recentPayloads
    .map(
      (p) =>
        `<div style="margin-bottom:1.5rem;border-bottom:1px solid #333;padding-bottom:1rem">
<strong>${p.receivedAt}</strong>
<pre style="background:#1a1a1a;padding:1rem;border-radius:8px;overflow-x:auto;white-space:pre-wrap">${escapeHtml(JSON.stringify(p.body, null, 2))}</pre>
</div>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Clay Callback Debug</title></head>
<body style="background:#111;color:#eee;font-family:monospace;padding:2rem">
<h2>Clay Callback Debug — ${recentPayloads.length} recent payload(s)</h2>
${rows}
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
