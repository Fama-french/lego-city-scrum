import { useState } from 'react'
import type { ClassroomSession, ProgressRow } from '../types/database'
import { stageLabel } from '../hooks/useSession'

type AdvancePatch = Partial<Pick<ClassroomSession, 'current_stage' | 'current_sprint' | 'priority_revealed' | 'estimates_revealed'>>

interface FacilitatorControlsProps {
  session: ClassroomSession
  priorityProgress: ProgressRow[]
  estimateProgress: ProgressRow[]
  onAdvance: (patch: AdvancePatch) => Promise<void>
  onReset: () => Promise<{ ok: true } | { ok: false; error: string }>
}

function allDone(progress: ProgressRow[]): boolean {
  return progress.length > 0 && progress.every((p) => p.complete)
}

function allValidated(priorityProgress: ProgressRow[], estimateProgress: ProgressRow[]): boolean {
  return allDone(priorityProgress) && allDone(estimateProgress)
}

export function FacilitatorControls({ session, priorityProgress, estimateProgress, onAdvance, onReset }: FacilitatorControlsProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  async function handleReset() {
    setResetting(true)
    setResetError(null)
    const result = await onReset()
    setResetting(false)
    if (!result.ok) {
      setResetError(result.error)
      return
    }
    setConfirmingReset(false)
  }

  function renderNextStepButton() {
    const { current_stage, current_sprint } = session

    switch (current_stage) {
      case 'join':
      case 'stories':
      case 'prioritization':
      case 'estimation': {
        const ready = allValidated(priorityProgress, estimateProgress)
        const nextStage = current_sprint === 0 ? 'backlog' : 'retrospective'
        const reveal = () => onAdvance({ priority_revealed: true, estimates_revealed: true, current_stage: nextStage })
        return (
          <div className="stack">
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!ready) {
                  const notDone = [...priorityProgress, ...estimateProgress]
                    .filter((p) => !p.complete)
                    .map((p) => p.name)
                  const uniqueNotDone = Array.from(new Set(notDone))
                  const confirmed = window.confirm(
                    `Not everyone has validated yet (still waiting on: ${uniqueNotDone.join(', ') || 'someone'}). Reveal anyway?`
                  )
                  if (!confirmed) return
                }
                reveal()
              }}
            >
              Reveal Order & Points {ready ? '' : '(not everyone has validated)'}
            </button>
          </div>
        )
      }
      case 'backlog':
        return (
          <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'sprint_planning', current_sprint: 1 })}>
            Start Sprint 1
          </button>
        )
      case 'sprint_planning':
        return <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'sprint' })}>Start Sprint</button>
      case 'sprint':
        return <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'demo' })}>Start Demo</button>
      case 'demo':
        return <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'retrospective' })}>Start Retrospective</button>
      case 'retrospective':
        return (
          <div className="stack">
            {current_sprint < 3 ? (
              <button
                className="btn btn-primary"
                onClick={() => onAdvance({ current_stage: 'sprint_planning', current_sprint: current_sprint + 1 })}
              >
                Start Sprint {current_sprint + 1}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'complete' })}>
                Finish Exercise
              </button>
            )}
            <div>
              <p className="hint" style={{ marginBottom: '0.35rem' }}>
                Added new stories during grooming? Re-open ordering &amp; estimating so they get a priority and
                points:
              </p>
              <button
                className="btn btn-small"
                onClick={() => onAdvance({ current_stage: 'stories', priority_revealed: false, estimates_revealed: false })}
              >
                Re-open Backlog Building
              </button>
            </div>
          </div>
        )
      case 'complete':
        return <span className="hint">Exercise complete.</span>
    }
  }

  return (
    <div className="facilitator-panel">
      <h2>Facilitator</h2>
      <p>
        Current stage: <strong>{stageLabel(session.current_stage)}</strong>
        {session.current_sprint > 0 && ` — Sprint ${session.current_sprint}`}
      </p>
      <div>{renderNextStepButton()}</div>

      <div className="reset-zone">
        {!confirmingReset ? (
          <button className="btn btn-danger btn-small" onClick={() => setConfirmingReset(true)}>
            RESET CLASSROOM
          </button>
        ) : (
          <div className="stack">
            <p>
              <strong>Reset the classroom?</strong>
              <br />
              This will delete all stories, rankings, estimates, assignments, sprint progress and retrospective
              notes. The six team members will remain.
            </p>
            {resetError && <p className="error-banner">{resetError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-small" onClick={() => setConfirmingReset(false)} disabled={resetting}>
                Cancel
              </button>
              <button className="btn btn-danger btn-small" onClick={handleReset} disabled={resetting}>
                {resetting ? 'Resetting…' : 'Reset Everything'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
