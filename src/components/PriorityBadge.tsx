import { useState, type MouseEvent } from 'react'
import type { Story } from '../types/database'

interface PriorityBadgeProps {
  story: Story
  priority: number | null
  editable: boolean
  onSetOverride: (storyId: string, priority: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function PriorityBadge({ story, priority, editable, onSetOverride }: PriorityBadgeProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(story.priority_override ?? priority ?? ''))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    const value = Number(draft)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Positive number only.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await onSetOverride(story.id, Math.round(value))
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setEditing(false)
  }

  async function clear(e: MouseEvent) {
    e.stopPropagation()
    setSaving(true)
    setError(null)
    const result = await onSetOverride(story.id, null)
    setSaving(false)
    if (!result.ok) setError(result.error)
  }

  if (!editable) {
    return <span className="priority-badge">{priority ? `#${priority}` : '—'}</span>
  }

  if (editing) {
    return (
      <span className="priority-badge" style={{ display: 'inline-flex', gap: '0.2rem', alignItems: 'center' }}>
        <input
          type="number"
          min={1}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ width: '3.2rem' }}
          aria-label="Override priority"
          autoFocus
        />
        <button type="button" className="btn btn-small btn-primary" onClick={save} disabled={saving} aria-label="Save priority">
          ✓
        </button>
        <button type="button" className="btn btn-small" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel">
          ✕
        </button>
        {error && <span className="hint">{error}</span>}
      </span>
    )
  }

  return (
    <span
      className="priority-badge"
      style={{ cursor: 'pointer', display: 'inline-flex', gap: '0.2rem', alignItems: 'center' }}
      onClick={() => setEditing(true)}
      title="Click to set priority manually"
    >
      {priority ? `#${priority}` : '—'}
      {story.priority_override != null && (
        <button type="button" className="btn btn-small" onClick={clear} disabled={saving} aria-label="Clear priority override">
          ×
        </button>
      )}
    </span>
  )
}
