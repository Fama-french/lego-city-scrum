import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProgressRow, StoryPoints, TeamEstimateRow } from '../types/database'

const PROGRESS_POLL_MS = 4000

interface UseEstimatesResult {
  myEstimates: Record<string, StoryPoints>
  progress: ProgressRow[]
  teamEstimates: TeamEstimateRow[] | null
  loading: boolean
  error: string | null
  submitEstimate: (storyId: string, points: StoryPoints, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function useEstimates(participantId: string | null, revealed: boolean): UseEstimatesResult {
  const [myEstimates, setMyEstimates] = useState<Record<string, StoryPoints>>({})
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [teamEstimates, setTeamEstimates] = useState<TeamEstimateRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMine = useCallback(async () => {
    if (!participantId) return
    const { data, error } = await supabase
      .from('estimates')
      .select('story_id, points')
      .eq('participant_id', participantId)
    if (error) {
      setError('Could not load your estimates.')
      return
    }
    const map: Record<string, StoryPoints> = {}
    for (const row of data ?? []) map[row.story_id] = row.points as StoryPoints
    setMyEstimates(map)
  }, [participantId])

  const loadProgress = useCallback(async () => {
    const { data, error } = await supabase.from('v_estimate_progress').select('*')
    if (!error && data) setProgress(data as ProgressRow[])
  }, [])

  const refreshTeamEstimates = useCallback(async () => {
    if (!revealed) {
      setTeamEstimates(null)
      return
    }
    const { data, error } = await supabase.rpc('get_team_estimates')
    if (error) {
      setError('Could not load the team estimates.')
      return
    }
    setTeamEstimates(
      (data as { story_id: string; median_points: number; submissions: number }[]).map((r) => ({
        story_id: r.story_id,
        median_points: Number(r.median_points),
        submissions: r.submissions,
      }))
    )
  }, [revealed])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadMine(), loadProgress(), refreshTeamEstimates()]).then(() => {
      if (!cancelled) setLoading(false)
    })

    const interval = setInterval(loadProgress, PROGRESS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [loadMine, loadProgress, refreshTeamEstimates])

  const submitEstimate = useCallback(
    async (storyId: string, points: StoryPoints, participantId: string) => {
      const { error } = await supabase
        .from('estimates')
        .upsert({ story_id: storyId, participant_id: participantId, points }, { onConflict: 'story_id,participant_id' })
      if (error) {
        return { ok: false as const, error: 'Could not save your estimate. Please try again.' }
      }
      await loadMine()
      await loadProgress()
      return { ok: true as const }
    },
    [loadMine, loadProgress]
  )

  return { myEstimates, progress, teamEstimates, loading, error, submitEstimate }
}
