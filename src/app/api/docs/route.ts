const BASE = "https://tokker-mistral-hackathon.vercel.app";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tokker API Docs</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #e0e0e0; font-family: -apple-system, 'Segoe UI', monospace; padding: 2rem; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #fff; margin-bottom: .5rem; }
    h2 { color: #a78bfa; margin: 2rem 0 .75rem; border-bottom: 1px solid #222; padding-bottom: .5rem; }
    h3 { color: #c4b5fd; margin: 1.5rem 0 .5rem; }
    .endpoint { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .method { display: inline-block; font-weight: bold; border-radius: 4px; padding: 2px 8px; font-size: .85rem; margin-right: .5rem; }
    .post { background: #2563eb22; color: #60a5fa; border: 1px solid #2563eb44; }
    .get { background: #16a34a22; color: #4ade80; border: 1px solid #16a34a44; }
    .url { color: #e2e8f0; font-size: .95rem; }
    .desc { color: #999; margin: .5rem 0; }
    pre { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 1rem; overflow-x: auto; font-size: .85rem; margin: .75rem 0; white-space: pre-wrap; }
    code { color: #a78bfa; }
    .field { color: #60a5fa; }
    .optional { color: #666; font-style: italic; }
    .status { display: inline-block; border-radius: 4px; padding: 1px 6px; font-size: .8rem; margin-right: .25rem; }
    .s2 { background: #16a34a22; color: #4ade80; }
    .s4 { background: #f59e0b22; color: #fbbf24; }
    .s5 { background: #ef444422; color: #f87171; }
    table { width: 100%; border-collapse: collapse; margin: .75rem 0; }
    th, td { text-align: left; padding: .4rem .75rem; border-bottom: 1px solid #1a1a1a; font-size: .85rem; }
    th { color: #999; }
    a { color: #a78bfa; }
    .subtitle { color: #666; margin-bottom: 2rem; }
  </style>
</head>
<body>

<h1>Tokker API</h1>
<p class="subtitle">Base URL: <code>${BASE}</code></p>

<!-- ═══ POST /api/enrich ═══ -->
<h2>1. Enrich Creator</h2>
<div class="endpoint">
  <span class="method post">POST</span>
  <span class="url">/api/enrich</span>
  <p class="desc">Trigger Clay/Modash enrichment for a TikTok creator. Returns sync data or an async request ID for polling.</p>

  <h3>Request Body</h3>
<pre>{
  <span class="field">"handle"</span>: "victoriazmei",          <span class="optional">// required — @handle, bare handle, or full TikTok URL</span>
  <span class="field">"niche_description"</span>: "fitness"     <span class="optional">// optional</span>
}</pre>

  <h3>Responses</h3>
  <table>
    <tr><th>Status</th><th>Body</th><th>Meaning</th></tr>
    <tr><td><span class="status s2">200</span></td><td><code>{ "status": "complete", "creator": {...}, "brands": [...] }</code></td><td>Sync — data returned immediately</td></tr>
    <tr><td><span class="status s2">200</span></td><td><code>{ "status": "pending", "requestId": "uuid" }</code></td><td>Async — poll with GET below</td></tr>
    <tr><td><span class="status s4">400</span></td><td><code>{ "error": "Missing TikTok handle" }</code></td><td>No handle provided</td></tr>
    <tr><td><span class="status s5">500</span></td><td><code>{ "error": "..." }</code></td><td>Server error</td></tr>
  </table>

  <h3>cURL</h3>
<pre>curl -X POST ${BASE}/api/enrich \\
  -H "Content-Type: application/json" \\
  -d '{"handle": "victoriazmei"}'</pre>
</div>

<!-- ═══ GET /api/enrich/[requestId] ═══ -->
<h2>2. Poll Enrichment Result</h2>
<div class="endpoint">
  <span class="method get">GET</span>
  <span class="url">/api/enrich/{requestId}</span>
  <p class="desc">Poll for async enrichment results. Keep polling every 3s until status is "complete".</p>

  <h3>Responses</h3>
  <table>
    <tr><th>Status</th><th>Body</th><th>Meaning</th></tr>
    <tr><td><span class="status s2">200</span></td><td><code>{ "status": "pending" }</code></td><td>Still processing</td></tr>
    <tr><td><span class="status s2">200</span></td><td><code>{ "status": "complete", "creator": {...}, "brands": [...] }</code></td><td>Done</td></tr>
    <tr><td><span class="status s4">404</span></td><td><code>{ "error": "Request not found" }</code></td><td>Invalid or expired request ID</td></tr>
  </table>
</div>

<!-- ═══ POST /api/clay-callback ═══ -->
<h2>3. Clay Callback (Webhook Receiver)</h2>
<div class="endpoint">
  <span class="method post">POST</span>
  <span class="url">/api/clay-callback</span>
  <p class="desc">Endpoint that Clay POSTs enriched Modash data back to. Configure as an HTTP API action column in your Clay table.</p>

  <h3>Headers</h3>
<pre>Content-Type: application/json
Authorization: Bearer &lt;CLAY_API_KEY&gt;</pre>

  <h3>Request Body</h3>
<pre>{
  <span class="field">"request_id"</span>: "uuid",                    <span class="optional">// required — from original webhook</span>
  <span class="field">"tiktok_handle"</span>: "victoriazmei",        <span class="optional">// required</span>
  <span class="field">"tiktok_url"</span>: "https://www.tiktok.com/@victoriazmei",
  <span class="field">"influencer_details"</span>: {                  <span class="optional">// Modash enrichment blob</span>
    "followers": 125000,
    "engagementRate": 0.045,
    "avgLikes": 5600,
    "avgComments": 120,
    "bio": "...",
    "gender": "FEMALE",
    "country": "US",
    "city": "Los Angeles",
    "isVerified": false,
    "interests": ["fitness", "wellness"],
    "postsCount": 342,
    "contacts": ["email@example.com"],
    "paidPostPerformance": 0.5
  },
  <span class="field">"brands"</span>: []                             <span class="optional">// optional — brand matches if any</span>
}</pre>

  <h3>Responses</h3>
  <table>
    <tr><th>Status</th><th>Body</th><th>Meaning</th></tr>
    <tr><td><span class="status s2">200</span></td><td><code>{ "status": "ok", "received": {...} }</code></td><td>Accepted — echoes raw payload back</td></tr>
    <tr><td><span class="status s4">400</span></td><td><code>{ "error": "Missing request_id" }</code></td><td>No request_id in body</td></tr>
    <tr><td><span class="status s4">401</span></td><td><code>{ "error": "Unauthorized" }</code></td><td>Bad or missing API key</td></tr>
    <tr><td><span class="status s5">500</span></td><td><code>{ "error": "Callback processing failed" }</code></td><td>Server error</td></tr>
  </table>

  <h3>Debug UI</h3>
  <p>Visit <a href="${BASE}/api/clay-callback">${BASE}/api/clay-callback</a> (GET) to see the last 20 raw payloads received.</p>
</div>

<!-- ═══ POST /api/agent ═══ -->
<h2>4. Run PR Strategy Agent</h2>
<div class="endpoint">
  <span class="method post">POST</span>
  <span class="url">/api/agent</span>
  <p class="desc">Run the Mistral orchestrator agent to generate personalized brand pitch strategies.</p>

  <h3>Request Body</h3>
<pre>{
  <span class="field">"creator"</span>: {
    "handle": "victoriazmei",
    "followers": "125K",
    "niche": "Fitness",
    "avgViews": "50K",
    "topContentThemes": ["workout", "nutrition"]
  },
  <span class="field">"brands"</span>: [
    {
      "name": "Nike", "domain": "nike.com", "industry": "Sports",
      "description": "...", "funding": "Public", "headcount": "70K+",
      "recentNews": "...", "fitScore": 90, "fitReason": "..."
    }
  ],
  <span class="field">"marketingRequest"</span>: "Help me land brand deals in fitness"
}</pre>

  <h3>Responses</h3>
  <table>
    <tr><th>Status</th><th>Body</th><th>Meaning</th></tr>
    <tr><td><span class="status s2">200</span></td><td><code>{ "overallStrategy": "...", "brandStrategies": [...] }</code></td><td>Strategy generated</td></tr>
    <tr><td><span class="status s4">400</span></td><td><code>{ "error": "Missing required fields: ..." }</code></td><td>Missing creator/brands/marketingRequest</td></tr>
    <tr><td><span class="status s5">500</span></td><td><code>{ "error": "..." }</code></td><td>Agent error</td></tr>
  </table>
</div>

</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
