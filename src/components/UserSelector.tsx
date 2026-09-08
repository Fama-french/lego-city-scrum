import { useState } from 'react'
import type { TeamMember } from '../types/database'

interface UserSelectorProps {
  members: TeamMember[]
  onJoin: (memberId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function UserSelector({ members, onJoin }: UserSelectorProps) {
  const [error, setError] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  async function handleClick(member: TeamMember) {
    if (member.auth_user_id) {
      const confirmed = window.confirm(
        `${member.name} is currently in use on another device. Join here anyway? (That device will be signed out of ${member.name}.)`
      )
      if (!confirmed) return
    }
    setError(null)
    setJoiningId(member.id)
    const result = await onJoin(member.id)
    setJoiningId(null)
    if (!result.ok) setError(result.error)
  }

  return (
    <div>
      <h2>Choose your name</h2>
      {error && <p className="error-banner">{error}</p>}
      <div className="user-grid">
        {members.map((member) => {
          const taken = member.auth_user_id !== null
          return (
            <button
              key={member.id}
              className="user-card"
              onClick={() => handleClick(member)}
              disabled={joiningId === member.id}
            >
              <span className="name">{member.name}</span>
              <span className="role">{member.role}</span>
              {taken && <span className="hint"> (in use)</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
