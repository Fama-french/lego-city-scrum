import { useEffect, useState } from 'react'
import type { PointSubmissionRow, Story } from '../types/database'
import { PersonName } from './PersonName'
import { PointsOverrideControl } from './PointsOverrideControl'

interface PointsReviewPanelProps {
  stories: Story[]
  totalParticipants: number
  onClose: () => void
  onFetch: () => Promise<{ ok: true; data: PointSubmissionRow[] } | { ok: false; error: string }>
  onSetOverride: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function PointsReviewPanel({ stories, totalParticipants, onClose, onFetch, onSetOverride }: PointsReviewPanelProps) {
  const [submissions, setSubmissions] = useState<PointSubmissionRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    onFetch().then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSubmissions(result.data)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '2rem 1rem',
      }}
    >
      <div className="card" style={{ maxWidth: 900, width: '100%', background: 'var(--white)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Review Points</h2>
          <button className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="hint">
          What everyone bet on each story, so you can arbitrate if the calculated result doesn&apos;t look
          right. Only visible to Ayush, Gbenro, and Leo.
        </p>

        {error && <p className="error-banner">{error}</p>}
        {!error && submissions === null && <p className="hint">Loading…</p>}

        {submissions !== null && stories.length === 0 && <div className="empty-state">No stories yet.</div>}

        {submissions !== null && stories.length > 0 && (
          <div className="stack">
            {stories.map((story) => {
              const rows = submissions.filter((s) => s.story_id === story.id)
              const average = rows.length > 0 ? rows.reduce((sum, r) => sum + r.points, 0) / rows.length : null
              return (
                <div className="card" key={story.id}>
                  <p className="story-sentence">{story.full_story}</p>
                  <p className="hint" style={{ marginBottom: '0.4rem' }}>
                    {rows.length} / {totalParticipants} submitted
                  </p>
                  {rows.length > 0 ? (
                    <ul className="progress-list" style={{ marginBottom: '0.5rem' }}>
                      {rows.map((r) => (
                        <li key={r.participant_id}>
                          <PersonName name={r.participant_name} />: {r.points} pts
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="hint">No submissions yet.</p>
                  )}
                  {average !== null && (
                    <p className="hint" style={{ marginBottom: '0.5rem' }}>
                      Average: {average.toFixed(1)} pts
                      {story.points_override != null && ` — overridden to ${story.points_override} pts`}
                    </p>
                  )}
                  <PointsOverrideControl story={story} onSetOverride={onSetOverride} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
