// Pure aggregation helpers used both by the client (for local/optimistic display)
// and mirrored by the SQL functions in supabase/migrations for the authoritative
// server-side calculation. Keep this file dependency-free so it is trivial to test.

export interface RankingEntry {
  storyId: string
  rank: number
}

export interface PriorityResult {
  storyId: string
  averageRank: number
  submissions: number
  priority: number
}

/**
 * Team priority = average ranking position across everyone who submitted a
 * ranking for that story. Lower average position wins (rank 1 = most important).
 * Ties break on `createdAtByStory` (earlier story wins) for a deterministic order.
 */
export function computeTeamPriority(
  entries: RankingEntry[],
  createdAtByStory: Record<string, string>
): PriorityResult[] {
  const byStory = new Map<string, number[]>()
  for (const entry of entries) {
    const list = byStory.get(entry.storyId) ?? []
    list.push(entry.rank)
    byStory.set(entry.storyId, list)
  }

  const results: Omit<PriorityResult, 'priority'>[] = Array.from(byStory.entries()).map(
    ([storyId, ranks]) => ({
      storyId,
      averageRank: ranks.reduce((sum, r) => sum + r, 0) / ranks.length,
      submissions: ranks.length,
    })
  )

  return assignPriorityPositions(results, createdAtByStory)
}

/**
 * Sorts already-aggregated per-story averages (e.g. from the get_team_priority
 * RPC, which does the averaging in SQL) and assigns 1-based priority
 * positions, using the same ascending-average / creation-time tie-break rule
 * as computeTeamPriority.
 */
export function assignPriorityPositions(
  aggregated: { storyId: string; averageRank: number; submissions: number }[],
  createdAtByStory: Record<string, string>
): PriorityResult[] {
  const sorted = [...aggregated].sort((a, b) => {
    if (a.averageRank !== b.averageRank) return a.averageRank - b.averageRank
    const aCreated = createdAtByStory[a.storyId] ?? ''
    const bCreated = createdAtByStory[b.storyId] ?? ''
    return aCreated.localeCompare(bCreated)
  })
  return sorted.map((r, index) => ({ ...r, priority: index + 1 }))
}

/**
 * Team estimate = median of submitted story points. Median is used instead of
 * the mean because story points are ordinal, and the median resists outliers
 * (e.g. one person estimating 13 while everyone else says 3).
 *
 * This is the "lower median" (matches Postgres's PERCENTILE_DISC(0.5), used
 * server-side): for an even number of submissions it picks the lower of the
 * two middle values rather than averaging them. Story points are a fixed
 * Fibonacci-ish scale, so an averaged result like 4 (between 3 and 5) isn't a
 * real point value — this guarantees the result is always one of the actual
 * submitted points, never a half-point. Leo, Gbenro, or Ayush can always
 * override the result manually if the team disagrees with it.
 */
export function medianPoints(points: number[]): number | null {
  if (points.length === 0) return null
  const sorted = [...points].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}
