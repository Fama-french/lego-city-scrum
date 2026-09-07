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
    const { current_stage, current_sprint, priority_revealed, estimates_revealed } = session

    switch (current_stage) {
      case 'join':
        return <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'stories' })}>Start Story Writing</button>
      case 'stories':
        return (
          <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'prioritization', priority_revealed: false })}>
            Start Prioritization
          </button>
        )
      case 'prioritization':
        if (!priority_revealed) {
          const ready = allDone(priorityProgress)
          return (
            <button className="btn btn-primary" disabled={!ready} onClick={() => onAdvance({ priority_revealed: true })}>
              Reveal Team Priority {ready ? '' : '(waiting for everyone)'}
            </button>
          )
        }
        return (
          <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'estimation', estimates_revealed: false })}>
            Start Estimation
          </button>
        )
      case 'estimation':
        if (!estimates_revealed) {
          const ready = allDone(estimateProgress)
          return (
            <button className="btn btn-primary" disabled={!ready} onClick={() => onAdvance({ estimates_revealed: true })}>
              Reveal Estimates {ready ? '' : '(waiting for everyone)'}
            </button>
          )
        }
        if (current_sprint === 0) {
          return (
            <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'backlog' })}>
              View Final Backlog
            </button>
          )
        }
        return (
          <button className="btn btn-primary" onClick={() => onAdvance({ current_stage: 'retrospective' })}>
            Back to Retrospective
          </button>
        )
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
                Added new stories during grooming? Re-run a quick vote so they get a priority/estimate:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-small"
                  onClick={() => onAdvance({ current_stage: 'prioritization', priority_revealed: false })}
                >
                  Re-run Prioritization
                </button>
                <button
                  className="btn btn-small"
                  onClick={() => onAdvance({ current_stage: 'estimation', estimates_revealed: false })}
                >
                  Re-run Estimation
                </button>
              </div>
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
