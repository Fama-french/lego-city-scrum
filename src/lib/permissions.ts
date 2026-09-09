import type { Story, TeamMember } from '../types/database'

// These helpers only control what the UI *offers*. They are not a security
// boundary — the real enforcement lives in Postgres RLS policies and the
// SECURITY DEFINER functions in supabase/migrations/*.sql. See the README
// "Security model" section for the full explanation.

const KANBAN_ADMIN_NAMES = ['Leo', 'Gbenro', 'Austin']
// Ayush (Scrum Master), Gbenro (Product Owner), and Leo arbitrate the backlog:
// overriding points/priority and hiding/deprioritizing stories.
const BACKLOG_ARBITRATOR_NAMES = ['Ayush', 'Gbenro', 'Leo']

export function isFacilitator(member: TeamMember | null): boolean {
  return member?.name === 'Leo'
}

/** Leo, Gbenro, and Austin can assign or remove *anyone* on the Kanban board, not just themselves. */
export function isKanbanAdmin(member: TeamMember | null): boolean {
  return member !== null && KANBAN_ADMIN_NAMES.includes(member.name)
}

export function canAssign(member: TeamMember | null, targetId: string): boolean {
  if (!member) return false
  return isKanbanAdmin(member) || targetId === member.id
}

export function canRemoveAssignee(member: TeamMember | null, targetId: string): boolean {
  if (!member) return false
  return isKanbanAdmin(member) || targetId === member.id
}

export function canChangeStoryStatus(member: TeamMember | null, story: Story): boolean {
  if (!member) return false
  return isKanbanAdmin(member) || story.assignees.includes(member.id)
}

function isBacklogArbitrator(member: TeamMember | null): boolean {
  return member !== null && BACKLOG_ARBITRATOR_NAMES.includes(member.name)
}

/** Ayush (Scrum Master), Gbenro (Product Owner), and Leo can override a story's final point value. */
export function canOverridePoints(member: TeamMember | null): boolean {
  return isBacklogArbitrator(member)
}

/** Same trio, for a story's priority (shown in the corner badge on each card). */
export function canOverridePriority(member: TeamMember | null): boolean {
  return isBacklogArbitrator(member)
}

/** Same trio, for hiding/deprioritizing a story out of the main backlog view. */
export function canHideStory(member: TeamMember | null): boolean {
  return isBacklogArbitrator(member)
}

export function canEditStory(member: TeamMember | null, story: Story): boolean {
  if (!member) return false
  if (isFacilitator(member)) return true
  return story.created_by === member.id || story.assignees.includes(member.id)
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
