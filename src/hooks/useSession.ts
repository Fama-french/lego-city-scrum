import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ClassroomSession, Stage } from '../types/database'

interface UseSessionResult {
  session: ClassroomSession | null
  loading: boolean
  error: string | null
  advanceStage: (patch: Partial<Pick<ClassroomSession, 'current_stage' | 'current_sprint' | 'priority_revealed' | 'estimates_revealed'>>) => Promise<void>
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<ClassroomSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('session').select('*').limit(1).maybeSingle()
    if (error) {
      setError('Could not load the classroom session.')
      return
    }
    setSession(data as ClassroomSession)
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => {
      if (!cancelled) setLoading(false)
    })

    const channel = supabase
      .channel('session_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session' }, (payload) => {
        setSession(payload.new as ClassroomSession)
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [load])

  const advanceStage = useCallback(
    async (patch: Partial<Pick<ClassroomSession, 'current_stage' | 'current_sprint' | 'priority_revealed' | 'estimates_revealed'>>) => {
      if (!session) return
      const { data, error } = await supabase
        .from('session')
        .update(patch)
        .eq('id', session.id)
        .select()
        .maybeSingle()
      if (error) {
        setError('Could not update the workflow stage. Only Leo can do this.')
        return
      }
      setSession(data as ClassroomSession)
    },
    [session]
  )

  return { session, loading, error, advanceStage }
}

export function stageLabel(stage: Stage): string {
  const labels: Record<Stage, string> = {
    join: 'Write, Order & Estimate',
    stories: 'Write, Order & Estimate',
    prioritization: 'Write, Order & Estimate',
    estimation: 'Write, Order & Estimate',
    backlog: 'Final Product Backlog',
    sprint_planning: 'Sprint Planning',
    sprint: 'Sprint',
    demo: 'Sprint Demo',
    retrospective: 'Retrospective & Grooming',
    complete: 'Exercise Complete',
  }
  return labels[stage]
}
