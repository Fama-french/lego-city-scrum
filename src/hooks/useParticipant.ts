import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamMember } from '../types/database'

interface UseParticipantResult {
  participant: TeamMember | null
  members: TeamMember[]
  loading: boolean
  authError: string | null
  join: (memberId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  switchUser: () => Promise<void>
}

/**
 * Wires up Supabase Anonymous Auth and binds the resulting stable auth.uid()
 * to one row in `team_members`. See the security-model comment at the top of
 * supabase/migrations/001_initial_schema.sql for why this exists.
 */
export function useParticipant(): UseParticipantResult {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase.from('team_members').select('*').order('created_at')
    if (error) {
      setAuthError('Could not load the team roster. Check your Supabase connection.')
      return
    }
    setMembers((data as TeamMember[]) ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      let uid = sessionData.session?.user.id ?? null

      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          if (!cancelled) {
            setAuthError(
              'Could not start an anonymous session. Ask your instructor to enable "Anonymous sign-ins" ' +
                'in the Supabase Auth settings (see README Troubleshooting).'
            )
            setLoading(false)
          }
          return
        }
        uid = data.user?.id ?? null
      }

      if (cancelled) return
      setUserId(uid)
      await loadMembers()
      if (!cancelled) setLoading(false)
    }

    init()

    const channel = supabase
      .channel('team_members_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        loadMembers()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [loadMembers])

  const participant = members.find((m) => m.auth_user_id === userId) ?? null

  const join = useCallback(
    async (memberId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!userId) return { ok: false, error: 'Not signed in yet. Please wait a moment and try again.' }

      const target = members.find((m) => m.id === memberId)
      if (target?.auth_user_id === userId) return { ok: true }

      // Claiming is a soft handoff, not an exclusive lock: this always
      // succeeds, even if someone else is currently using the name. The UI
      // shows an "(in use)" hint and asks for confirmation before calling
      // this, so an accidental takeover requires an explicit choice.
      const { data, error } = await supabase
        .from('team_members')
        .update({ auth_user_id: userId })
        .eq('id', memberId)
        .select()
        .maybeSingle()

      if (error || !data) {
        await loadMembers()
        return { ok: false, error: 'Could not join right now. Please try again.' }
      }

      await loadMembers()
      return { ok: true }
    },
    [members, userId, loadMembers]
  )

  const switchUser = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      setAuthError('Could not switch users. Please reload the page.')
      setLoading(false)
      return
    }
    setUserId(data.user?.id ?? null)
    await loadMembers()
    setLoading(false)
  }, [loadMembers])

  return { participant, members, loading, authError, join, switchUser }
}
