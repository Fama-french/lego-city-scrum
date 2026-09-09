import type { Category, RetroNote, Story, TeamMember } from '../types/database'
import { Retrospective } from '../components/Retrospective'

interface RetrospectivePageProps {
  sprint: number
  notes: RetroNote[]
  members: TeamMember[]
  participant: TeamMember
  stories: Story[]
  priorityMap: Record<string, number>
  pointsMap: Record<string, number>
  onAddNote: (note: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onAddStory: (input: { actor: string; want: string; benefit: string; categories: Category[]; createdBy: string }) => Promise<{ ok: true } | { ok: false; error: string }>
  onUpdateStory: (id: string, patch: Partial<Story>) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetPointsOverride: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetPriorityOverride: (storyId: string, priority: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetDeprioritized: (storyId: string, deprioritized: boolean) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function RetrospectivePage({
  sprint,
  notes,
  members,
  participant,
  stories,
  priorityMap,
  pointsMap,
  onAddNote,
  onAddStory,
  onUpdateStory,
  onSetPointsOverride,
  onSetPriorityOverride,
  onSetDeprioritized,
}: RetrospectivePageProps) {
  return (
    <div className="stack">
      <h1>SPRINT {sprint} RETROSPECTIVE</h1>
      <Retrospective
        sprint={sprint}
        notes={notes}
        members={members}
        participant={participant}
        onAddNote={onAddNote}
        stories={stories}
        priorityMap={priorityMap}
        pointsMap={pointsMap}
        onAddStory={(input) => onAddStory({ ...input, createdBy: participant.id })}
        onUpdateStory={onUpdateStory}
        onSetPointsOverride={onSetPointsOverride}
        onSetPriorityOverride={onSetPriorityOverride}
        onSetDeprioritized={onSetDeprioritized}
      />
    </div>
  )
}
