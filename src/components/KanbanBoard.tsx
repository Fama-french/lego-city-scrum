import { useState } from 'react'
import type { Story, StoryStatus, TeamMember } from '../types/database'
import { isFacilitator } from '../lib/permissions'
import { StoryCard } from './StoryCard'

interface KanbanBoardProps {
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  pointsMap?: Record<string, number>
  onClaim: (storyId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  onSetStatus: (storyId: string, status: StoryStatus) => Promise<{ ok: true } | { ok: false; error: string }>
  onUnassign: (storyId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

const COLUMNS: { status: StoryStatus; title: string }[] = [
  { status: 'backlog', title: 'BACKLOG' },
  { status: 'in_progress', title: 'IN PROGRESS' },
  { status: 'done', title: 'DONE' },
]

export function KanbanBoard({ stories, members, participant, pointsMap, onClaim, onSetStatus, onUnassign }: KanbanBoardProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const facilitator = isFacilitator(participant)

  async function moveTo(story: Story, target: StoryStatus) {
    setError(null)
    if (target === story.status) return

    if (facilitator) {
      const result = await onSetStatus(story.id, target)
      if (!result.ok) setError(result.error)
      return
    }

    if (target === 'in_progress' && story.assigned_to === null) {
      const result = await onClaim(story.id)
      if (!result.ok) setError(result.error)
      return
    }

    if (story.assigned_to !== participant.id) {
      setError('You can only move your own stories.')
      return
    }

    if (target === 'backlog') {
      const result = await onUnassign(story.id)
      if (!result.ok) setError(result.error)
      return
    }

    const result = await onSetStatus(story.id, target)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="stack">
      {error && <p className="error-banner">{error}</p>}
      <div className="kanban">
        {COLUMNS.map((col) => {
          const columnStories = stories.filter((s) => s.status === col.status)
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
              {columnStories.length === 0 && (
                <p className="hint" style={{ textAlign: 'center' }}>
                  {col.status === 'in_progress' ? 'No stories are currently in progress.' : 'Empty'}
                </p>
              )}
              <div className="stack">
                {columnStories.map((story) => {
                  const mine = story.assigned_to === participant.id
                  const unassigned = story.assigned_to === null
                  return (
                    <div key={story.id} draggable onDragStart={() => setDragId(story.id)}>
                      <StoryCard
                        story={story}
                        members={members}
                        points={pointsMap?.[story.id] ?? null}
                        actions={
                          <>
                            {col.status === 'backlog' && unassigned && (
                              <button className="btn btn-small btn-primary" onClick={() => moveTo(story, 'in_progress')}>
                                Assign to me
                              </button>
                            )}
                            {col.status === 'in_progress' && (mine || facilitator) && (
                              <button className="btn btn-small btn-primary" onClick={() => moveTo(story, 'done')}>
                                Mark Done
                              </button>
                            )}
                            {col.status === 'in_progress' && (mine || facilitator) && (
                              <button className="btn btn-small" onClick={() => moveTo(story, 'backlog')}>
                                Back to Backlog
                              </button>
                            )}
                            {col.status === 'done' && (mine || facilitator) && (
                              <button className="btn btn-small" onClick={() => moveTo(story, 'in_progress')}>
                                Reopen
                              </button>
                            )}
                            {facilitator && !unassigned && (
                              <button className="btn btn-small" onClick={() => onUnassign(story.id)}>
                                Unassign
                              </button>
                            )}
                          </>
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
