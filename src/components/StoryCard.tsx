import type { ReactNode } from 'react'
import type { Story, TeamMember } from '../types/database'
import { CategoryTagList } from './CategoryTag'
import { PersonName } from './PersonName'

interface StoryCardProps {
  story: Story
  members: TeamMember[]
  priority?: number | null
  points?: number | string | null
  showStatus?: boolean
  showSprint?: boolean
  actions?: ReactNode
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

export function StoryCard({ story, members, priority, points, showStatus, showSprint, actions }: StoryCardProps) {
  const creator = nameOf(members, story.created_by)
  const assignee = nameOf(members, story.assigned_to)

  return (
    <div className="card kanban-card">
      <CategoryTagList categories={story.categories} />
      <p className="story-sentence">{story.full_story}</p>
      <div className="story-meta">
        <span>
          <strong>Created by:</strong> {creator ? <PersonName name={creator} /> : '—'}
        </span>
        <span>
          <strong>Assignee:</strong> {assignee ? <PersonName name={assignee} /> : '—'}
        </span>
        <span>
          <strong>Priority:</strong> {priority ? `#${priority}` : 'Not ranked'}
        </span>
        <span>
          <strong>Estimate:</strong> {points != null ? `${points} pts` : 'Not estimated'}
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
