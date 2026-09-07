import type { TeamMember } from '../types/database'
import { UserSelector } from '../components/UserSelector'
import { HowItWorks } from '../components/HowItWorks'
import { CityVision } from '../components/CityVision'

interface JoinPageProps {
  members: TeamMember[]
  loading: boolean
  authError: string | null
  onJoin: (memberId: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function JoinPage({ members, loading, authError, onJoin }: JoinPageProps) {
  return (
    <div className="container">
      <div className="stack" style={{ maxWidth: 720, margin: '2rem auto' }}>
        <h1 style={{ textAlign: 'center' }}>LEGO CITY SCRUM</h1>
        <p style={{ textAlign: 'center' }}>Turn a city vision into a product backlog.</p>

        {authError && <p className="error-banner">{authError}</p>}

        {loading ? (
          <p className="hint" style={{ textAlign: 'center' }}>
            Connecting…
          </p>
        ) : (
          <UserSelector members={members} onJoin={onJoin} />
        )}

        <CityVision />
        <HowItWorks />
      </div>
    </div>
  )
}
