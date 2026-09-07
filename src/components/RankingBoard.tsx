import { useEffect, useState } from 'react'
import type { Story } from '../types/database'

interface RankingBoardProps {
  stories: Story[]
  initialRanking: Record<string, number> | null
  submitted: boolean
  onSubmit: (orderedStoryIds: string[]) => Promise<{ ok: true } | { ok: false; error: string }>
}

function initialOrder(stories: Story[], ranking: Record<string, number> | null): string[] {
  const ids = stories.map((s) => s.id)
  if (!ranking || Object.keys(ranking).length === 0) return ids
  return [...ids].sort((a, b) => (ranking[a] ?? 999) - (ranking[b] ?? 999))
}

export function RankingBoard({ stories, initialRanking, submitted, onSubmit }: RankingBoardProps) {
  const [order, setOrder] = useState<string[]>(() => initialOrder(stories, initialRanking))
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)

  useEffect(() => {
    setOrder((prev) => {
      const known = new Set(stories.map((s) => s.id))
      const kept = prev.filter((id) => known.has(id))
      const missing = stories.map((s) => s.id).filter((id) => !kept.includes(id))
      return [...kept, ...missing]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories.length])

  const storyById = new Map(stories.map((s) => [s.id, s]))

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...order]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setOrder(next)
    setDragIndex(null)
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    const result = await onSubmit(order)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setJustSubmitted(true)
  }

  return (
    <div className="card">
      <h2>Prioritize the Backlog</h2>
      <p className="hint">
        Drag the stories into the order you think the team should build them (or use the arrow buttons). Most
        important at the top. Your order is private until Leo reveals the team priority.
      </p>

      <p className="hint">MOST IMPORTANT</p>
      <ul className="rank-list">
        {order.map((id, index) => {
          const story = storyById.get(id)
          if (!story) return null
          return (
            <li
              key={id}
              className={`rank-item${dragIndex === index ? ' dragging' : ''}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
            >
              <span className="rank-number">{index + 1}</span>
              <span style={{ flex: 1 }}>{story.full_story}</span>
              <div className="reorder-buttons">
                <button
                  type="button"
                  className="btn btn-small"
                  aria-label={`Move "${story.full_story}" up`}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="btn btn-small"
                  aria-label={`Move "${story.full_story}" down`}
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                >
                  ▼
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="hint">LEAST IMPORTANT</p>

      {error && <p className="error-banner">{error}</p>}
      {justSubmitted && !error && <p className="hint">Your ranking has been submitted.</p>}

      <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving || order.length === 0}>
        {saving ? 'Saving…' : submitted ? 'Update My Ranking' : 'Submit My Ranking'}
      </button>
    </div>
  )
}
