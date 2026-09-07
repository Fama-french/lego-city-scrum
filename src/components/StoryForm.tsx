import { useState, type FormEvent } from 'react'
import { ACTOR_SUGGESTIONS, CATEGORIES, type Category } from '../types/database'
import { buildFullStory } from '../lib/storyText'

interface StoryFormProps {
  onSubmit: (input: { actor: string; want: string; benefit: string; category: Category }) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function StoryForm({ onSubmit }: StoryFormProps) {
  const [actor, setActor] = useState('')
  const [want, setWant] = useState('')
  const [benefit, setBenefit] = useState('')
  const [category, setCategory] = useState<Category>('Other')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const preview = actor.trim() && want.trim() && benefit.trim() ? buildFullStory(actor, want, benefit) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!actor.trim() || !want.trim() || !benefit.trim()) {
      setError('Please fill in all three fields.')
      return
    }
    setSubmitting(true)
    const result = await onSubmit({ actor, want, benefit, category })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setActor('')
    setWant('')
    setBenefit('')
    setCategory('Other')
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add a User Story</h2>
      <p className="hint">Turn the city prompt into something a citizen needs. Think about WHO needs something and WHY.</p>

      <div className="field">
        <label htmlFor="actor">As a...</label>
        <input
          id="actor"
          list="actor-suggestions"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="parent"
          maxLength={60}
        />
        <datalist id="actor-suggestions">
          {ACTOR_SUGGESTIONS.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label htmlFor="want">I want...</label>
        <input
          id="want"
          value={want}
          onChange={(e) => setWant(e.target.value)}
          placeholder="an affordable school near my home"
          maxLength={140}
        />
      </div>

      <div className="field">
        <label htmlFor="benefit">So that...</label>
        <input
          id="benefit"
          value={benefit}
          onChange={(e) => setBenefit(e.target.value)}
          placeholder="my children can receive an education"
          maxLength={140}
        />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {preview && (
        <p className="hint">
          Preview: <em>{preview}</em>
        </p>
      )}

      {error && <p className="error-banner">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add Story'}
      </button>
    </form>
  )
}
