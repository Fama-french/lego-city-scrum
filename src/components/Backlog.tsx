import type { Story, TeamMember } from '../types/database'
import { StoryCard } from './StoryCard'

interface BacklogProps {
  stories: Story[]
  members: TeamMember[]
  priorityMap?: Record<string, number>
  pointsMap?: Record<string, number>
}

export function Backlog({ stories, members, priorityMap, pointsMap }: BacklogProps) {
  if (stories.length === 0) {
    return (
      <div className="empty-state">No user stories yet. Turn the city vision into something a citizen needs.</div>
    )
  }

  return (
    <div className="stack">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          members={members}
          priority={priorityMap?.[story.id] ?? null}
          points={pointsMap?.[story.id] ?? null}
          showStatus
          showSprint
        />
      ))}
    </div>
  )
}
