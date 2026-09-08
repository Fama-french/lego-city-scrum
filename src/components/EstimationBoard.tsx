import { useState } from 'react'
import { STORY_POINTS, type Story, type StoryPoints } from '../types/database'
import { PointsHelp } from './PointsHelp'
import { CategoryTagList } from './CategoryTag'

interface EstimationBoardProps {
  stories: Story[]
  myEstimates: Record<string, StoryPoints>
  onSubmit: (storyId: string, points: StoryPoints) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function EstimationBoard({ stories, myEstimates, onSubmit }: EstimationBoardProps) {
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const doneCount = stories.filter((s) => myEstimates[s.id] != null).length

  async function handlePick(storyId: string, points: StoryPoints) {
    setSavingId(storyId)
    setError(null)
    const result = await onSubmit(storyId, points)
    setSavingId(null)
    if (!result.ok) setError(result.error)
  }

  if (stories.length === 0) {
    return <div className="empty-state">No stories to estimate yet.</div>
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Estimate the Backlog</h2>
        <p className="hint">Estimate relative effort and complexity, not hours.</p>
        <strong>
          {doneCount} / {stories.length} stories estimated by you
        </strong>
      </div>

      <PointsHelp />

      {error && <p className="error-banner">{error}</p>}

      {stories.map((story) => (
        <div className="card" key={story.id}>
          <CategoryTagList categories={story.categories} />
          <p className="story-sentence">{story.full_story}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {STORY_POINTS.map((points) => (
              <button
                key={points}
                type="button"
                className={myEstimates[story.id] === points ? 'btn btn-primary' : 'btn'}
                onClick={() => handlePick(story.id, points)}
                disabled={savingId === story.id}
                aria-pressed={myEstimates[story.id] === points}
              >
                {points}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
