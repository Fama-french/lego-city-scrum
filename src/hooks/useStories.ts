import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildFullStory } from '../lib/storyText'
import type { Category, Story, StoryStatus } from '../types/database'

interface NewStoryInput {
  actor: string
  want: string
  benefit: string
  categories: Category[]
  createdBy: string
}

interface UseStoriesResult {
  stories: Story[]
  loading: boolean
  error: string | null
  addStory: (input: NewStoryInput) => Promise<{ ok: true } | { ok: false; error: string }>
  updateStory: (id: string, patch: Partial<Story>) => Promise<{ ok: true } | { ok: false; error: string }>
  claimStory: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>
  setStatus: (id: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function useStories(): UseStoriesResult {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('stories').select('*').order('created_at')
    if (error) {
      setError('Could not load the backlog. Please try refreshing.')
      return
    }
    setStories((data as Story[]) ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    load().then(() => {
      if (!cancelled) setLoading(false)
    })

    const channel = supabase
      .channel('stories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        load()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [load])

  const addStory = useCallback(async (input: NewStoryInput) => {
    const full_story = buildFullStory(input.actor, input.want, input.benefit)
    const { error } = await supabase.from('stories').insert({
      actor: input.actor.trim(),
      want: input.want.trim(),
      benefit: input.benefit.trim(),
      full_story,
      categories: input.categories,
      created_by: input.createdBy,
      status: 'backlog',
    })
    if (error) {
      return { ok: false as const, error: 'Something went wrong saving your story. Please try again.' }
    }
    return { ok: true as const }
  }, [])

  const updateStory = useCallback(async (id: string, patch: Partial<Story>) => {
    const { error } = await supabase.from('stories').update(patch).eq('id', id)
    if (error) {
      return { ok: false as const, error: 'Could not save that change. Please try again.' }
    }
    return { ok: true as const }
  }, [])

  const claimStory = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('claim_story', { p_story_id: id })
    if (error) {
      return { ok: false as const, error: error.message.includes('claimed') ? 'Someone else just claimed this story.' : 'Could not claim that story. Please try again.' }
    }
    return { ok: true as const }
  }, [])

  const setStatus = useCallback(
    async (id: string, status: StoryStatus) => updateStory(id, { status }),
    [updateStory]
  )

  return { stories, loading, error, addStory, updateStory, claimStory, setStatus }
}
