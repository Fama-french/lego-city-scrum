import type { Story, TeamMember } from '../types/database'

// These helpers only control what the UI *offers*. They are not a security
// boundary — the real enforcement lives in Postgres RLS policies and the
// SECURITY DEFINER functions in supabase/migrations/001_initial_schema.sql.
// See the README "Security model" section for the full explanation.

export function isFacilitator(member: TeamMember | null): boolean {
  return member?.name === 'Leo'
}

export function canClaimStory(member: TeamMember | null, story: Story): boolean {
  if (!member) return false
  if (isFacilitator(member)) return true
  return story.assigned_to === null
}

export function canEditStory(member: TeamMember | null, story: Story): boolean {
  if (!member) return false
  if (isFacilitator(member)) return true
  return story.created_by === member.id || story.assigned_to === member.id
}

export function threeStoryProgress(
  members: TeamMember[],
  stories: Story[]
): Array<{ member: TeamMember; count: number; done: boolean }> {
  return members.map((member) => {
    const count = stories.filter((s) => s.created_by === member.id).length
    return { member, count, done: count >= 3 }
  })
}
