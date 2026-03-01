/**
 * Quick smoke test: hit the /api/enrich endpoint for a real handle.
 *
 * Usage:
 *   npx tsx scripts/test-enrich.ts
 */

const BASE =
  process.env.BASE_URL ?? "http://localhost:3000";
const HANDLE = process.argv[2] ?? "victoriazmei";

async function main() {
  console.log(`\n→ POST ${BASE}/api/enrich  { handle: "${HANDLE}" }\n`);

  const res = await fetch(`${BASE}/api/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: HANDLE }),
  });

  const data = await res.json();
  console.log(`Status: ${res.status}`);

  if (data.status === "complete") {
    console.log(`\nCreator:`);
    console.log(`  Handle:   @${data.creator?.handle}`);
    console.log(`  Followers: ${data.creator?.followers}`);
    console.log(`  Niche:     ${data.creator?.niche}`);
    console.log(`  Avg Views: ${data.creator?.avgViews}`);
    console.log(`  Themes:    ${data.creator?.topContentThemes?.join(", ")}`);
    console.log(`\nBrands (${data.brands?.length ?? 0}):`);
    for (const b of data.brands ?? []) {
      console.log(`  ${b.fitScore}  ${b.name} (${b.domain}) — ${b.industry}`);
      console.log(`       ${b.fitReason.slice(0, 120)}`);
    }
  } else if (data.status === "pending") {
    console.log(`\nAsync mode — poll: GET ${BASE}/api/enrich/${data.requestId}`);
  } else {
    console.log("\nResponse:", JSON.stringify(data, null, 2));
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
