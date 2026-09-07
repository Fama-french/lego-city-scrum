import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProgressRow, TeamPriorityRow } from '../types/database'

const PROGRESS_POLL_MS = 4000

interface UseRankingsResult {
  myRanking: Record<string, number> | null // storyId -> rank, null until fetched
  submitted: boolean
  progress: ProgressRow[]
  teamPriority: TeamPriorityRow[] | null
  loading: boolean
  error: string | null
  submitRanking: (orderedStoryIds: string[], participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  refreshTeamPriority: () => Promise<void>
}

export function useRankings(participantId: string | null, revealed: boolean): UseRankingsResult {
  const [myRanking, setMyRanking] = useState<Record<string, number> | null>(null)
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [teamPriority, setTeamPriority] = useState<TeamPriorityRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMine = useCallback(async () => {
    if (!participantId) return
    const { data, error } = await supabase
      .from('rankings')
      .select('story_id, rank')
      .eq('participant_id', participantId)
    if (error) {
      setError('Could not load your ranking.')
      return
    }
    const map: Record<string, number> = {}
    for (const row of data ?? []) map[row.story_id] = row.rank
    setMyRanking(map)
  }, [participantId])

  const loadProgress = useCallback(async () => {
    const { data, error } = await supabase.from('v_ranking_progress').select('*')
    if (!error && data) setProgress(data as ProgressRow[])
  }, [])

  const refreshTeamPriority = useCallback(async () => {
    if (!revealed) {
      setTeamPriority(null)
      return
    }
    const { data, error } = await supabase.rpc('get_team_priority')
    if (error) {
      setError('Could not load the team priority.')
      return
    }
    setTeamPriority(
      (data as { story_id: string; average_rank: number; submissions: number }[]).map((r) => ({
        story_id: r.story_id,
        average_rank: Number(r.average_rank),
        submissions: r.submissions,
      }))
    )
  }, [revealed])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadMine(), loadProgress(), refreshTeamPriority()]).then(() => {
      if (!cancelled) setLoading(false)
    })

    const interval = setInterval(loadProgress, PROGRESS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [loadMine, loadProgress, refreshTeamPriority])

  const submitted = myRanking !== null && Object.keys(myRanking).length > 0

  const submitRanking = useCallback(
    async (orderedStoryIds: string[], participantId: string) => {
      const rows = orderedStoryIds.map((storyId, index) => ({
        story_id: storyId,
        participant_id: participantId,
        rank: index + 1,
      }))
      const { error } = await supabase.from('rankings').upsert(rows, { onConflict: 'story_id,participant_id' })
      if (error) {
        return { ok: false as const, error: 'Could not save your ranking. Please try again.' }
      }
      await loadMine()
      await loadProgress()
      return { ok: true as const }
    },
    [loadMine, loadProgress]
  )

  return { myRanking, submitted, progress, teamPriority, loading, error, submitRanking, refreshTeamPriority }
}
