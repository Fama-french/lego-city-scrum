import type { ReactNode } from 'react'
import type { ClassroomSession, TeamMember } from '../types/database'
import { canOverridePoints, isFacilitator } from '../lib/permissions'
import { stageLabel } from '../hooks/useSession'
import { memberColor } from '../lib/colors'

interface LayoutProps {
  participant: TeamMember
  session: ClassroomSession
  onSwitchUser: () => void
  onReviewPoints: () => void
  children: ReactNode
}

export function Layout({ participant, session, onSwitchUser, onReviewPoints, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar-title">LEGO CITY SCRUM</span>
        <div className="topbar-meta">
          <div className="meta-item">
            <strong style={{ color: memberColor(participant.name) }}>{participant.name}</strong>
            {participant.role}
          </div>
          <div className="meta-item">
            Sprint
            <strong>{session.current_sprint > 0 ? session.current_sprint : '—'}</strong>
          </div>
          <div className="meta-item">
            Stage
            <strong>{stageLabel(session.current_stage)}</strong>
          </div>
          {isFacilitator(participant) && <span className="badge badge-facilitator">FACILITATOR</span>}
          {canOverridePoints(participant) && (
            <button className="btn btn-small" onClick={onReviewPoints}>
              Review Points
            </button>
          )}
          <button className="btn-link" onClick={onSwitchUser}>
            Switch user
          </button>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  )
}
