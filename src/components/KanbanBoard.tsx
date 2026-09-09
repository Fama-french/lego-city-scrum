import { useState } from 'react'
import type { Story, StoryStatus, TeamMember } from '../types/database'
import { canChangeStoryStatus, canHideStory, canOverridePoints, canOverridePriority, isKanbanAdmin } from '../lib/permissions'
import { StoryCard } from './StoryCard'

interface KanbanBoardProps {
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  pointsMap?: Record<string, number>
  priorityMap?: Record<string, number>
  onAddAssignee: (storyId: string, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onRemoveAssignee: (storyId: string, participantId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetStatus: (storyId: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetPointsOverride: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetPriorityOverride: (storyId: string, priority: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetDeprioritized: (storyId: string, deprioritized: boolean) => Promise<{ ok: true } | { ok: false; error: string }>
}

const COLUMNS: { status: StoryStatus; title: string }[] = [
  { status: 'backlog', title: 'BACKLOG' },
  { status: 'in_progress', title: 'IN PROGRESS' },
  { status: 'done', title: 'DONE' },
]

function nameOf(members: TeamMember[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? 'Unknown'
}

function byPriority(priorityMap: Record<string, number> | undefined) {
  return (a: Story, b: Story) => (priorityMap?.[a.id] ?? Infinity) - (priorityMap?.[b.id] ?? Infinity)
}

function AssignOtherControl({
  story,
  members,
  onAdd,
}: {
  story: Story
  members: TeamMember[]
  onAdd: (participantId: string) => void
}) {
  const available = members.filter((m) => !story.assignees.includes(m.id))
  const [selected, setSelected] = useState(available[0]?.id ?? '')

  if (available.length === 0) return null

  return (
    <span style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Assign someone else">
        {available.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-small" onClick={() => selected && onAdd(selected)}>
        Assign
      </button>
    </span>
  )
}

export function KanbanBoard({
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
}: KanbanBoardProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const admin = isKanbanAdmin(participant)
  const pointsOverrideAllowed = canOverridePoints(participant)
  const priorityOverrideAllowed = canOverridePriority(participant)
  const hideAllowed = canHideStory(participant)

  async function handle(result: { ok: true } | { ok: false; error: string }) {
    if (!result.ok) setError(result.error)
    else setError(null)
  }

  async function moveTo(story: Story, target: StoryStatus) {
    if (target === story.status) return
    if (!canChangeStoryStatus(participant, story)) {
      setError('Only an assignee (or Leo, Gbenro, Austin) can move this story.')
      return
    }
    handle(await onSetStatus(story.id, target))
  }

  function renderCard(story: Story, col: { status: StoryStatus; title: string }) {
    const isAssignee = story.assignees.includes(participant.id)
    const canModifyStatus = canChangeStoryStatus(participant, story)
    return (
      <div key={story.id} draggable onDragStart={() => setDragId(story.id)}>
        <StoryCard
          story={story}
          members={members}
          priority={priorityMap?.[story.id] ?? null}
          points={pointsMap?.[story.id] ?? null}
          canOverridePoints={pointsOverrideAllowed}
          onSetPointsOverride={onSetPointsOverride}
          canOverridePriority={priorityOverrideAllowed}
          onSetPriorityOverride={onSetPriorityOverride}
          actions={
            <>
              {!isAssignee && (
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => onAddAssignee(story.id, participant.id).then(handle)}
                >
                  Assign to me
                </button>
              )}
              {isAssignee && (
                <button className="btn btn-small" onClick={() => onRemoveAssignee(story.id, participant.id).then(handle)}>
                  Leave
                </button>
              )}

              {canModifyStatus && col.status === 'backlog' && (
                <button className="btn btn-small" onClick={() => moveTo(story, 'in_progress')}>
                  Move to In Progress
                </button>
              )}
              {canModifyStatus && col.status === 'in_progress' && (
                <>
                  <button className="btn btn-small btn-primary" onClick={() => moveTo(story, 'done')}>
                    Mark Done
                  </button>
                  <button className="btn btn-small" onClick={() => moveTo(story, 'backlog')}>
                    Back to Backlog
                  </button>
                </>
              )}
              {canModifyStatus && col.status === 'done' && (
                <button className="btn btn-small" onClick={() => moveTo(story, 'in_progress')}>
                  Reopen
                </button>
              )}

              {admin &&
                story.assignees
                  .filter((id) => id !== participant.id)
                  .map((id) => (
                    <button key={id} className="btn btn-small" onClick={() => onRemoveAssignee(story.id, id).then(handle)}>
                      Remove {nameOf(members, id)}
                    </button>
                  ))}
              {admin && <AssignOtherControl story={story} members={members} onAdd={(id) => onAddAssignee(story.id, id).then(handle)} />}

              {hideAllowed && (
                <button
                  className="btn btn-small"
                  onClick={() => onSetDeprioritized(story.id, !story.deprioritized).then(handle)}
                >
                  {story.deprioritized ? 'Restore' : 'Hide'}
                </button>
              )}
            </>
          }
        />
      </div>
    )
  }

  return (
    <div className="stack">
      {error && <p className="error-banner">{error}</p>}
      <div className="kanban">
        {COLUMNS.map((col) => {
          const columnStories = stories.filter((s) => s.status === col.status).sort(byPriority(priorityMap))
          const active = col.status === 'backlog' ? columnStories.filter((s) => !s.deprioritized) : columnStories
          const hidden = col.status === 'backlog' ? columnStories.filter((s) => s.deprioritized) : []
          return (
            <div
              key={col.status}
              className="kanban-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const story = stories.find((s) => s.id === dragId)
                if (story) moveTo(story, col.status)
                setDragId(null)
              }}
            >
              <h3>{col.title}</h3>
              {active.length === 0 && (
                <p className="hint" style={{ textAlign: 'center' }}>
                  {col.status === 'in_progress' ? 'No stories are currently in progress.' : 'Empty'}
                </p>
              )}
              <div className="stack">{active.map((story) => renderCard(story, col))}</div>

              {hidden.length > 0 && (
                <details style={{ marginTop: '0.75rem' }}>
                  <summary>Deprioritized ({hidden.length})</summary>
                  <div className="stack" style={{ marginTop: '0.5rem' }}>
                    {hidden.map((story) => renderCard(story, col))}
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
