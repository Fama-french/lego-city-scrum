import { useState, type FormEvent } from 'react'
import type { RetroNote, Story, TeamMember } from '../types/database'
import type { Category } from '../types/database'
import { canEditStory } from '../lib/permissions'
import { StoryCard } from './StoryCard'
import { StoryForm } from './StoryForm'
import { CategoryPicker } from './CategoryPicker'
import { PersonName } from './PersonName'

interface RetrospectiveProps {
  sprint: number
  notes: RetroNote[]
  members: TeamMember[]
  participant: TeamMember
  onAddNote: (note: string) => Promise<{ ok: true } | { ok: false; error: string }>
  stories: Story[]
  priorityMap: Record<string, number>
  pointsMap: Record<string, number>
  onAddStory: (input: { actor: string; want: string; benefit: string; categories: Category[] }) => Promise<{ ok: true } | { ok: false; error: string }>
  onUpdateStory: (id: string, patch: Partial<Story>) => Promise<{ ok: true } | { ok: false; error: string }>
}

function nameOf(members: TeamMember[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? 'Unknown'
}

export function Retrospective({
  sprint,
  notes,
  members,
  participant,
  onAddNote,
  stories,
  priorityMap,
  pointsMap,
  onAddStory,
  onUpdateStory,
}: RetrospectiveProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleAddNote(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await onAddNote(text)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setText('')
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Retrospective</h2>
        <p className="hint">What should we do differently next sprint?</p>
        {notes.length === 0 ? (
          <div className="empty-state">No retrospective notes yet.</div>
        ) : (
          <ul>
            {notes
              .filter((n) => n.sprint === sprint)
              .map((n) => (
                <li key={n.id}>
                  {n.note} — <PersonName name={nameOf(members, n.author_id)} />
                </li>
              ))}
          </ul>
        )}
        <form className="stack" onSubmit={handleAddNote} style={{ marginTop: '0.5rem' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="retro-note">Add a note</label>
            <textarea id="retro-note" value={text} onChange={(e) => setText(e.target.value)} placeholder="We should communicate before building." />
          </div>
          {error && <p className="error-banner">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Add Note
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Backlog Grooming</h2>
        <p className="hint">Add new stories, adjust categories, or move stories between states.</p>
      </div>

      <StoryForm onSubmit={onAddStory} />

      <div className="stack">
        {stories.map((story) => {
          const editable = canEditStory(participant, story)
          return (
            <StoryCard
              key={story.id}
              story={story}
              members={members}
              priority={priorityMap[story.id] ?? null}
              points={pointsMap[story.id] ?? null}
              showStatus
              actions={
                editable ? (
                  <div className="stack" style={{ width: '100%' }}>
                    <CategoryPicker
                      selected={story.categories}
                      onChange={(next) => onUpdateStory(story.id, { categories: next })}
                    />
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor={`status-${story.id}`}>Status</label>
                      <select
                        id={`status-${story.id}`}
                        value={story.status}
                        onChange={(e) => onUpdateStory(story.id, { status: e.target.value as Story['status'] })}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ) : null
              }
            />
          )
        })}
      </div>
    </div>
  )
}
