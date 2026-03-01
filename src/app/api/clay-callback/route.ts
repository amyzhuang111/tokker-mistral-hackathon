import { NextRequest, NextResponse } from "next/server";
import { completeRequest, normalizeClayResponse } from "@/lib/clay";

const CLAY_API_KEY = process.env.CLAY_API_KEY;
const DOCS_URL = "https://tokker-mistral-hackathon.vercel.app/api/docs";

/** In-memory log of the last 20 raw payloads received (for /api/clay-callback GET debug UI) */
const recentPayloads: { receivedAt: string; body: unknown }[] = [];

export async function POST(req: NextRequest) {
  // Try to parse the body — if it fails, still return 200 with guidance
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    // Not valid JSON — log raw text and return 200 with docs link
    const raw = await req.text().catch(() => "");
    console.log("Clay callback received non-JSON body:", raw);
    recentPayloads.unshift({ receivedAt: new Date().toISOString(), body: { _raw: raw, _error: "not valid JSON" } });
    if (recentPayloads.length > 20) recentPayloads.pop();

    return NextResponse.json({
      status: "ok",
      warning: "Body was not valid JSON — logged for debugging",
      docs: DOCS_URL,
      debug: `${DOCS_URL.replace("/docs", "/clay-callback")} (GET to see recent payloads)`,
    });
  }

  // Log the FULL raw payload — always, before any validation
  console.log("Clay callback RAW payload:", JSON.stringify(body, null, 2));
  recentPayloads.unshift({ receivedAt: new Date().toISOString(), body });
  if (recentPayloads.length > 20) recentPayloads.pop();

  // Skip auth check if no API key is configured
  if (CLAY_API_KEY) {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== CLAY_API_KEY) {
      console.warn("Clay callback — API key mismatch (logged payload anyway)");
      // Still return 200 so Clay doesn't retry / show errors
      return NextResponse.json({
        status: "ok",
        warning: "API key mismatch — payload logged but not processed",
        received: body,
        docs: DOCS_URL,
      });
    }
  }

  // If no request_id, still accept it — just don't store in enrichment map
  const requestId = body.request_id as string | undefined;
  if (!requestId) {
    console.log("Clay callback — no request_id, skipping enrichment store");
    return NextResponse.json({
      status: "ok",
      warning: "No request_id — payload logged but not linked to an enrichment request",
      received: body,
      docs: DOCS_URL,
    });
  }

  // Normalize and store — wrapped in try/catch but never 500
  try {
    const handle = (body.tiktok_handle ?? body.influencer_handle ?? body.handle ?? "") as string;
    const result = normalizeClayResponse(body, handle);
    completeRequest(requestId, result);
    console.log(`Clay callback completed: requestId=${requestId}, handle=${handle}, brands=${result.brands.length}`);
  } catch (err) {
    console.error("Clay callback normalize error (payload still logged):", err);
  }

  return NextResponse.json({ status: "ok", received: body });
}

/** GET /api/clay-callback — debug page showing recent raw payloads */
export async function GET() {
  if (recentPayloads.length === 0) {
    const html = `<!DOCTYPE html><html><head><title>Clay Callback Debug</title></head>
<body style="background:#111;color:#eee;font-family:monospace;padding:2rem">
<h2>Clay Callback Debug</h2>
<p>No payloads received yet. POST to this endpoint from Clay and refresh.</p>
<p style="margin-top:1rem"><a href="${DOCS_URL}" style="color:#a78bfa">API Docs</a></p>
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
<p style="margin-bottom:1rem"><a href="${DOCS_URL}" style="color:#a78bfa">API Docs</a></p>
${rows}
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
