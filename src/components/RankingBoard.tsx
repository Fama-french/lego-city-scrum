import { useState } from 'react'
import type { Story } from '../types/database'

interface RankingBoardProps {
  stories: Story[]
  order: string[]
  onReorder: (orderedStoryIds: string[]) => void
}

export function RankingBoard({ stories, order, onReorder }: RankingBoardProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const storyById = new Map(stories.map((s) => [s.id, s]))

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    onReorder(next)
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...order]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    onReorder(next)
    setDragIndex(null)
  }

  return (
    <div className="card">
      <h2>Order the Backlog</h2>
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
    </div>
  )
}
