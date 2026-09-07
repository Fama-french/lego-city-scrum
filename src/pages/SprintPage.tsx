import type { Story, StoryStatus, TeamMember } from '../types/database'
import { KanbanBoard } from '../components/KanbanBoard'

interface SprintPageProps {
  planning: boolean
  sprint: number
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  pointsMap: Record<string, number>
  onClaim: (storyId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetStatus: (storyId: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
  onUnassign: (storyId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function SprintPage({ planning, sprint, stories, members, participant, pointsMap, onClaim, onSetStatus, onUnassign }: SprintPageProps) {
  return (
    <div className="stack">
      <h1>{planning ? `SPRINT ${sprint} PLANNING` : `SPRINT ${sprint}`}</h1>
      <p className="hint">
        {planning
          ? 'Each developer chooses a story to work on. Assigning a story moves it to In Progress.'
          : 'Build! Drag cards or use the buttons to keep the board up to date.'}
      </p>
      <KanbanBoard
        stories={stories}
        members={members}
        participant={participant}
        pointsMap={pointsMap}
        onClaim={onClaim}
        onSetStatus={onSetStatus}
        onUnassign={onUnassign}
      />
    </div>
  )
}
