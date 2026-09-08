import { useState } from 'react'
import type { Category, ProgressRow, Story, StoryPoints, TeamMember } from '../types/database'
import { StoryForm } from '../components/StoryForm'
import { Backlog } from '../components/Backlog'
import { CityVision } from '../components/CityVision'
import { RankingBoard } from '../components/RankingBoard'
import { useOrderState } from '../hooks/useOrderState'
import { EstimationBoard } from '../components/EstimationBoard'
import { ProgressIndicator } from '../components/ProgressIndicator'
import { PersonName } from '../components/PersonName'
import { threeStoryProgress } from '../lib/permissions'

interface StoriesPageProps {
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  onAddStory: (input: {
    actor: string
    want: string
    benefit: string
    categories: Category[]
    createdBy: string
  }) => Promise<{ ok: true } | { ok: false; error: string }>
  myRanking: Record<string, number> | null
  rankingProgress: ProgressRow[]
  onSubmitRanking: (orderedStoryIds: string[]) => Promise<{ ok: true } | { ok: false; error: string }>
  myEstimates: Record<string, StoryPoints>
  estimateProgress: ProgressRow[]
  onSubmitEstimate: (storyId: string, points: StoryPoints) => Promise<{ ok: true } | { ok: false; error: string }>
}

function mergeValidatedProgress(rankingProgress: ProgressRow[], estimateProgress: ProgressRow[]): ProgressRow[] {
  return rankingProgress.map((r) => {
    const e = estimateProgress.find((p) => p.participant_id === r.participant_id)
    return { ...r, complete: r.complete && (e?.complete ?? false) }
  })
}

export function StoriesPage({
  stories,
  members,
  participant,
  onAddStory,
  myRanking,
  rankingProgress,
  onSubmitRanking,
  myEstimates,
  estimateProgress,
  onSubmitEstimate,
}: StoriesPageProps) {
  const [order, setOrder] = useOrderState(stories, myRanking)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [justValidated, setJustValidated] = useState(false)

  const storyProgress = threeStoryProgress(members, stories)
  const myStoryCount = stories.filter((s) => s.created_by === participant.id).length
  const hasWrittenAStory = myStoryCount > 0
  const validatedProgress = mergeValidatedProgress(rankingProgress, estimateProgress)
  const myValidated = validatedProgress.find((p) => p.participant_id === participant.id)?.complete ?? false

  async function handleValidate() {
    setValidateError(null)
    const missing = stories.filter((s) => myEstimates[s.id] == null)
    if (missing.length > 0) {
      setValidateError(`Estimate every story first — ${missing.length} still need a point value.`)
      return
    }
    if (order.length !== stories.length) {
      setValidateError('Please finish ordering every story before validating.')
      return
    }
    setValidating(true)
    const result = await onSubmitRanking(order)
    setValidating(false)
    if (!result.ok) {
      setValidateError(result.error)
      return
    }
    setJustValidated(true)
  }

  return (
    <div className="stack">
      <CityVision />

      <div className="card">
        <h2>Story Progress</h2>
        <p className="hint">Each person should contribute at least three user stories.</p>
        <ul className="progress-list">
          {storyProgress.map(({ member, count, done }) => (
            <li key={member.id}>
              <PersonName name={member.name} />: {count} / 3 {done ? '✓' : ''}
            </li>
          ))}
        </ul>
      </div>

      <h2>Stories written so far</h2>
      <Backlog stories={stories} members={members} />

      <StoryForm onSubmit={(input) => onAddStory({ ...input, createdBy: participant.id })} />

      {!hasWrittenAStory ? (
        <div className="empty-state">Write your first story above to unlock ordering and estimating.</div>
      ) : (
        <>
          <RankingBoard stories={stories} order={order} onReorder={setOrder} />
          <EstimationBoard stories={stories} myEstimates={myEstimates} onSubmit={onSubmitEstimate} />

          <div className="card">
            <h2>Validate</h2>
            <p className="hint">
              Once your order and every estimate look right, validate them. You can keep changing and
              re-validate any time before Leo reveals the team results.
            </p>
            {validateError && <p className="error-banner">{validateError}</p>}
            {myValidated && !validateError && <p className="hint">✓ You&apos;re validated.</p>}
            {justValidated && !myValidated && !validateError && (
              <p className="hint">Saved — waiting for the progress list to refresh…</p>
            )}
            <button type="button" className="btn btn-primary" onClick={handleValidate} disabled={validating}>
              {validating ? 'Saving…' : myValidated ? 'Re-validate' : 'Validate My Order & Points'}
            </button>
          </div>

          <ProgressIndicator progress={validatedProgress} label="people have validated their order & points" />
        </>
      )}
    </div>
  )
}
