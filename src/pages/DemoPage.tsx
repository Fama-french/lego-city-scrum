import type { Story, StoryStatus, TeamMember } from '../types/database'
import { KanbanBoard } from '../components/KanbanBoard'

interface DemoPageProps {
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

export function DemoPage({
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
}: DemoPageProps) {
  return (
    <div className="stack">
      <h1>SPRINT {sprint} DEMO</h1>
      <p className="hint">Discuss what was built with the teaching staff. Feedback can become new stories during the retrospective.</p>
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
