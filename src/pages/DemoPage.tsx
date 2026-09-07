import type { Story, StoryStatus, TeamMember } from '../types/database'
import { KanbanBoard } from '../components/KanbanBoard'

interface DemoPageProps {
  sprint: number
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  pointsMap: Record<string, number>
  onClaim: (storyId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetStatus: (storyId: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
  onUnassign: (storyId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function DemoPage({ sprint, stories, members, participant, pointsMap, onClaim, onSetStatus, onUnassign }: DemoPageProps) {
  return (
    <div className="stack">
      <h1>SPRINT {sprint} DEMO</h1>
      <p className="hint">Discuss what was built with the teaching staff. Feedback can become new stories during the retrospective.</p>
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
