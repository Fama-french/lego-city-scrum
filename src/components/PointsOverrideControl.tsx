import { useState } from 'react'
import type { Story } from '../types/database'

interface PointsOverrideControlProps {
  story: Story
  onSetOverride: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function PointsOverrideControl({ story, onSetOverride }: PointsOverrideControlProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(story.points_override ?? ''))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    const value = Number(draft)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a positive number.')
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

  async function clear() {
    setSaving(true)
    setError(null)
    const result = await onSetOverride(story.id, null)
    setSaving(false)
    if (!result.ok) setError(result.error)
  }

  if (editing) {
    return (
      <span style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
        <input
          type="number"
          min={1}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ width: '4.5rem' }}
          aria-label="Override points"
        />
        <button type="button" className="btn btn-small btn-primary" onClick={save} disabled={saving}>
          Save
        </button>
        <button type="button" className="btn btn-small" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </button>
        {error && <span className="hint">{error}</span>}
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
      <button type="button" className="btn btn-small" onClick={() => setEditing(true)}>
        {story.points_override != null ? 'Change points' : 'Override points'}
      </button>
      {story.points_override != null && (
        <button type="button" className="btn btn-small" onClick={clear} disabled={saving}>
          Clear override
        </button>
      )}
      {error && <span className="hint">{error}</span>}
    </span>
  )
}
