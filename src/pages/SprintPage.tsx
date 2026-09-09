import type { Story, StoryStatus, TeamMember } from '../types/database'
import { KanbanBoard } from '../components/KanbanBoard'

interface SprintPageProps {
  planning: boolean
  sprint: number
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  pointsMap: Record<string, number>
  priorityMap: Record<string, number>
  onAddAssignee: (storyId: string, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onRemoveAssignee: (storyId: string, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetStatus: (storyId: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetPointsOverride: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetPriorityOverride: (storyId: string, priority: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetDeprioritized: (storyId: string, deprioritized: boolean) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function SprintPage({
  planning,
  sprint,
  stories,
  members,
  participant,
  pointsMap,
  priorityMap,
  onAddAssignee,
  onRemoveAssignee,
  onSetStatus,
  onSetPointsOverride,
  onSetPriorityOverride,
  onSetDeprioritized,
}: SprintPageProps) {
  return (
    <div className="stack">
      <h1>{planning ? `SPRINT ${sprint} PLANNING` : `SPRINT ${sprint}`}</h1>
      <p className="hint">
        {planning
          ? 'Each developer chooses a story to work on. A story can have more than one person on it. Assigning yourself moves it to In Progress. Cards are ordered by team priority.'
          : 'Build! Drag cards or use the buttons to keep the board up to date.'}
      </p>
      <KanbanBoard
        stories={stories}
        members={members}
        participant={participant}
        pointsMap={pointsMap}
        priorityMap={priorityMap}
        onAddAssignee={onAddAssignee}
        onRemoveAssignee={onRemoveAssignee}
        onSetStatus={onSetStatus}
        onSetPointsOverride={onSetPointsOverride}
        onSetPriorityOverride={onSetPriorityOverride}
        onSetDeprioritized={onSetDeprioritized}
      />
    </div>
  )
}
