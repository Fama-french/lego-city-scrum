import type { ProgressRow } from '../types/database'
import { PersonName } from './PersonName'

export function ProgressIndicator({ progress, label }: { progress: ProgressRow[]; label: string }) {
  const doneCount = progress.filter((p) => p.complete).length
  return (
    <div className="card">
      <strong>
        {doneCount} / {progress.length} {label}
      </strong>
      <ul className="progress-list" style={{ marginTop: '0.5rem' }}>
        {progress.map((p) => (
          <li key={p.participant_id}>
            <PersonName name={p.name} /> {p.complete ? '✓' : '○'}
          </li>
        ))}
      </ul>
    </div>
  )
}
