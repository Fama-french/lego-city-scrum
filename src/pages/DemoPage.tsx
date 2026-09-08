import type { Story, StoryStatus, TeamMember } from '../types/database'
import { KanbanBoard } from '../components/KanbanBoard'

interface DemoPageProps {
  sprint: number
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  pointsMap: Record<string, number>
  onAddAssignee: (storyId: string, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onRemoveAssignee: (storyId: string, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetStatus: (storyId: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function DemoPage({ sprint, stories, members, participant, pointsMap, onAddAssignee, onRemoveAssignee, onSetStatus }: DemoPageProps) {
  return (
    <div className="stack">
      <h1>SPRINT {sprint} DEMO</h1>
      <p className="hint">Discuss what was built with the teaching staff. Feedback can become new stories during the retrospective.</p>
      <KanbanBoard
        stories={stories}
        members={members}
        participant={participant}
        pointsMap={pointsMap}
        onAddAssignee={onAddAssignee}
        onRemoveAssignee={onRemoveAssignee}
        onSetStatus={onSetStatus}
      />
    </div>
  )
}
