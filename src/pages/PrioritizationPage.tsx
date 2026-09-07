import type { ProgressRow, Story, TeamMember, TeamPriorityRow } from '../types/database'
import { RankingBoard } from '../components/RankingBoard'
import { ProgressIndicator } from '../components/ProgressIndicator'
import { Backlog } from '../components/Backlog'
import { assignPriorityPositions } from '../lib/aggregation'

interface PrioritizationPageProps {
  stories: Story[]
  members: TeamMember[]
  myRanking: Record<string, number> | null
  submitted: boolean
  progress: ProgressRow[]
  revealed: boolean
  teamPriority: TeamPriorityRow[] | null
  onSubmit: (orderedStoryIds: string[]) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function PrioritizationPage({ stories, members, myRanking, submitted, progress, revealed, teamPriority, onSubmit }: PrioritizationPageProps) {
  if (stories.length === 0) {
    return <div className="empty-state">No stories yet — go back and write some first.</div>
  }

  if (revealed && teamPriority) {
    const createdAtByStory = Object.fromEntries(stories.map((s) => [s.id, s.created_at]))
    const ranked = assignPriorityPositions(
      teamPriority.map((r) => ({ storyId: r.story_id, averageRank: r.average_rank, submissions: r.submissions })),
      createdAtByStory
    )
    const priorityMap = Object.fromEntries(ranked.map((r) => [r.storyId, r.priority]))
    const ordered = [...stories].sort((a, b) => (priorityMap[a.id] ?? 999) - (priorityMap[b.id] ?? 999))
    return (
      <div className="stack">
        <div className="card">
          <h2>Team Priority</h2>
          <p className="hint">Priority = average ranking position across everyone who voted. Lower average = higher priority.</p>
        </div>
        <Backlog stories={ordered} members={members} priorityMap={priorityMap} />
      </div>
    )
  }

  return (
    <div className="stack">
      <ProgressIndicator progress={progress} label="people have submitted their priorities" />
      <RankingBoard stories={stories} initialRanking={myRanking} submitted={submitted} onSubmit={onSubmit} />
    </div>
  )
}
