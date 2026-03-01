/**
 * Pre-pitch deal value heuristic based on fitScore + follower count.
 * Returns a human-readable range like "$500 – $2,000".
 * The agent's real numbers replace these on Step 4.
 */
export function estimateValue(
  fitScore: number,
  followersStr: string
): string {
  // Parse follower count from strings like "340K", "1.2M", "89K"
  const num = parseFollowerCount(followersStr);

  // Base rate per 1K followers, adjusted by fit score
  const fitMultiplier = fitScore >= 80 ? 1.5 : fitScore >= 60 ? 1.0 : 0.6;
  const basePer1K = 5; // $5 per 1K followers base
  const rawValue = (num / 1000) * basePer1K * fitMultiplier;

  // Create a range (±40%)
  const low = Math.max(100, Math.round(rawValue * 0.6 / 50) * 50);
  const high = Math.round(rawValue * 1.4 / 50) * 50;

  return `$${low.toLocaleString()} – $${Math.max(high, low + 100).toLocaleString()}`;
}

function parseFollowerCount(str: string): number {
  const cleaned = str.replace(/,/g, "").trim().toUpperCase();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/);
  if (!match) return 10000; // fallback
  const value = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === "K") return value * 1_000;
  if (suffix === "M") return value * 1_000_000;
  if (suffix === "B") return value * 1_000_000_000;
  return value;
}
