import type { ReactNode } from 'react'
import type { Story, TeamMember } from '../types/database'
import { CategoryTagList } from './CategoryTag'
import { PersonName } from './PersonName'
import { PointsOverrideControl } from './PointsOverrideControl'
import { PriorityBadge } from './PriorityBadge'

interface StoryCardProps {
  story: Story
  members: TeamMember[]
  priority?: number | null
  points?: number | string | null
  showStatus?: boolean
  showSprint?: boolean
  actions?: ReactNode
  canOverridePoints?: boolean
  onSetPointsOverride?: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  canOverridePriority?: boolean
  onSetPriorityOverride?: (storyId: string, priority: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
}

function nameOf(members: TeamMember[], id: string | null): string | null {
  if (!id) return null
  return members.find((m) => m.id === id)?.name ?? 'Unknown'
}

const STATUS_LABEL: Record<Story['status'], string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
}

export function StoryCard({
  story,
  members,
  priority = null,
  points,
  showStatus,
  showSprint,
  actions,
  canOverridePoints,
  onSetPointsOverride,
  canOverridePriority,
  onSetPriorityOverride,
}: StoryCardProps) {
  const creator = nameOf(members, story.created_by)
  const assigneeNames = story.assignees.map((id) => nameOf(members, id)).filter((n): n is string => n !== null)

  return (
    <div className="card kanban-card" style={story.deprioritized ? { opacity: 0.6 } : undefined}>
      {onSetPriorityOverride && (
        <PriorityBadge
          story={story}
          priority={priority}
          editable={Boolean(canOverridePriority)}
          onSetOverride={onSetPriorityOverride}
        />
      )}
      <CategoryTagList categories={story.categories} />
      {story.deprioritized && <span className="category-tag">DEPRIORITIZED</span>}
      <p className="story-sentence">{story.full_story}</p>
      <div className="story-meta">
        <span>
          <strong>Created by:</strong> {creator ? <PersonName name={creator} /> : '—'}
        </span>
        <span>
          <strong>Assignees:</strong>{' '}
          {assigneeNames.length > 0
            ? assigneeNames.map((name, i) => (
                <span key={name}>
                  {i > 0 && ', '}
                  <PersonName name={name} />
                </span>
              ))
            : '—'}
        </span>
        {!onSetPriorityOverride && (
          <span>
            <strong>Priority:</strong> {priority ? `#${priority}` : 'Not ranked'}
          </span>
        )}
        <span>
          <strong>Estimate:</strong> {points != null ? `${points} pts` : 'Not estimated'}
          {story.points_override != null && ' (overridden)'}
          {canOverridePoints && onSetPointsOverride && (
            <>
              {' '}
              <PointsOverrideControl story={story} onSetOverride={onSetPointsOverride} />
            </>
          )}
        </span>
        {showStatus && (
          <span>
            <strong>Status:</strong> {STATUS_LABEL[story.status]}
          </span>
        )}
        {showSprint && story.sprint && (
          <span>
            <strong>Sprint:</strong> {story.sprint}
          </span>
        )}
      </div>
      {actions && <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}
