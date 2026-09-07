import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RetroNote } from '../types/database'

interface UseRetroNotesResult {
  notes: RetroNote[]
  loading: boolean
  error: string | null
  addNote: (sprint: number, note: string, authorId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function useRetroNotes(): UseRetroNotesResult {
  const [notes, setNotes] = useState<RetroNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('retro_notes').select('*').order('created_at')
    if (error) {
      setError('Could not load retrospective notes.')
      return
    }
    setNotes((data as RetroNote[]) ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => {
      if (!cancelled) setLoading(false)
    })

    const channel = supabase
      .channel('retro_notes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retro_notes' }, () => {
        load()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [load])

  const addNote = useCallback(async (sprint: number, note: string, authorId: string) => {
    const trimmed = note.trim()
    if (!trimmed) return { ok: false as const, error: 'Note cannot be empty.' }
    const { error } = await supabase.from('retro_notes').insert({ sprint, note: trimmed, author_id: authorId })
    if (error) {
      return { ok: false as const, error: 'Could not save that note. Please try again.' }
    }
    return { ok: true as const }
  }, [])

  return { notes, loading, error, addNote }
}
