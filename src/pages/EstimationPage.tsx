import type { ProgressRow, Story, StoryPoints, TeamEstimateRow, TeamMember } from '../types/database'
import { EstimationBoard } from '../components/EstimationBoard'
import { ProgressIndicator } from '../components/ProgressIndicator'
import { Backlog } from '../components/Backlog'

interface EstimationPageProps {
  stories: Story[]
  members: TeamMember[]
  myEstimates: Record<string, StoryPoints>
  progress: ProgressRow[]
  revealed: boolean
  teamEstimates: TeamEstimateRow[] | null
  onSubmit: (storyId: string, points: StoryPoints) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function EstimationPage({ stories, members, myEstimates, progress, revealed, teamEstimates, onSubmit }: EstimationPageProps) {
  if (revealed && teamEstimates) {
    const pointsMap = Object.fromEntries(teamEstimates.map((r) => [r.story_id, r.median_points]))
    return (
      <div className="stack">
        <div className="card">
          <h2>Team Estimates</h2>
          <p className="hint">Estimate = median of submitted story points (resists outliers better than a mean).</p>
        </div>
        <Backlog stories={stories} members={members} pointsMap={pointsMap} />
      </div>
    )
  }

  return (
    <div className="stack">
      <ProgressIndicator progress={progress} label="estimates submitted" />
      <EstimationBoard stories={stories} myEstimates={myEstimates} onSubmit={onSubmit} />
    </div>
  )
}
