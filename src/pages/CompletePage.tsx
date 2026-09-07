import type { Story, TeamMember } from '../types/database'
import { BacklogPage } from './BacklogPage'

interface CompletePageProps {
  stories: Story[]
  members: TeamMember[]
  priorityMap: Record<string, number>
  pointsMap: Record<string, number>
}

export function CompletePage({ stories, members, priorityMap, pointsMap }: CompletePageProps) {
  const done = stories.filter((s) => s.status === 'done').length
  return (
    <div className="stack">
      <h1>FINAL BACKLOG / CITY</h1>
      <p className="hint">
        The exercise is complete. {done} of {stories.length} stories were finished across three sprints.
      </p>
      <BacklogPage stories={stories} members={members} priorityMap={priorityMap} pointsMap={pointsMap} />
    </div>
  )
}
