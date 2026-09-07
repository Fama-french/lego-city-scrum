import { useMemo } from 'react'
import { useParticipant } from './hooks/useParticipant'
import { useSession } from './hooks/useSession'
import { useStories } from './hooks/useStories'
import { useRankings } from './hooks/useRankings'
import { useEstimates } from './hooks/useEstimates'
import { useRetroNotes } from './hooks/useRetroNotes'
import { assignPriorityPositions } from './lib/aggregation'
import { isFacilitator } from './lib/permissions'
import { Layout } from './components/Layout'
import { FacilitatorControls } from './components/FacilitatorControls'
import { CityVision } from './components/CityVision'
import { HowItWorks } from './components/HowItWorks'
import { JoinPage } from './pages/JoinPage'
import { StoriesPage } from './pages/StoriesPage'
import { PrioritizationPage } from './pages/PrioritizationPage'
import { EstimationPage } from './pages/EstimationPage'
import { BacklogPage } from './pages/BacklogPage'
import { SprintPage } from './pages/SprintPage'
import { DemoPage } from './pages/DemoPage'
import { RetrospectivePage } from './pages/RetrospectivePage'
import { CompletePage } from './pages/CompletePage'
import { supabase } from './lib/supabase'

function App() {
  const { participant, members, loading: authLoading, authError, join, switchUser } = useParticipant()
  const { session, error: sessionError, advanceStage } = useSession()
  const stories = useStories()
  const rankings = useRankings(participant?.id ?? null, session?.priority_revealed ?? false)
  const estimates = useEstimates(participant?.id ?? null, session?.estimates_revealed ?? false)
  const retro = useRetroNotes()

  const createdAtByStory = useMemo(
    () => Object.fromEntries(stories.stories.map((s) => [s.id, s.created_at])),
    [stories.stories]
  )

  const priorityMap = useMemo(() => {
    if (!rankings.teamPriority) return {}
    const ranked = assignPriorityPositions(
      rankings.teamPriority.map((r) => ({ storyId: r.story_id, averageRank: r.average_rank, submissions: r.submissions })),
      createdAtByStory
    )
    return Object.fromEntries(ranked.map((r) => [r.storyId, r.priority]))
  }, [rankings.teamPriority, createdAtByStory])

  const pointsMap = useMemo(() => {
    if (!estimates.teamEstimates) return {}
    return Object.fromEntries(estimates.teamEstimates.map((r) => [r.story_id, r.median_points]))
  }, [estimates.teamEstimates])

  async function handleReset(): Promise<{ ok: true } | { ok: false; error: string }> {
    const { error } = await supabase.rpc('reset_classroom')
    if (error) return { ok: false, error: 'Could not reset the classroom. Only Leo can do this.' }
    return { ok: true }
  }

  if (authLoading && !participant) {
    return (
      <div className="center-page">
        <p>Connecting…</p>
      </div>
    )
  }

  if (!participant) {
    return <JoinPage members={members} loading={authLoading} authError={authError} onJoin={join} />
  }

  if (!session) {
    return (
      <div className="center-page">
        <p>{sessionError ?? 'Loading classroom session…'}</p>
      </div>
    )
  }

  function renderStage() {
    if (!session) return null
    switch (session.current_stage) {
      case 'join':
        return (
          <div className="stack" style={{ maxWidth: 640, margin: '2rem auto' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <h2>You&apos;re in, {participant!.name}.</h2>
              <p className="hint">Waiting for Leo to start user story writing…</p>
            </div>
            <CityVision />
            <HowItWorks />
          </div>
        )
      case 'stories':
        return (
          <StoriesPage
            stories={stories.stories}
            members={members}
            participant={participant!}
            onAddStory={stories.addStory}
          />
        )
      case 'prioritization':
        return (
          <PrioritizationPage
            stories={stories.stories}
            members={members}
            myRanking={rankings.myRanking}
            submitted={rankings.submitted}
            progress={rankings.progress}
            revealed={session.priority_revealed}
            teamPriority={rankings.teamPriority}
            onSubmit={(order) => rankings.submitRanking(order, participant!.id)}
          />
        )
      case 'estimation':
        return (
          <EstimationPage
            stories={stories.stories}
            members={members}
            myEstimates={estimates.myEstimates}
            progress={estimates.progress}
            revealed={session.estimates_revealed}
            teamEstimates={estimates.teamEstimates}
            onSubmit={(storyId, points) => estimates.submitEstimate(storyId, points, participant!.id)}
          />
        )
      case 'backlog':
        return <BacklogPage stories={stories.stories} members={members} priorityMap={priorityMap} pointsMap={pointsMap} />
      case 'sprint_planning':
      case 'sprint':
        return (
          <SprintPage
            planning={session.current_stage === 'sprint_planning'}
            sprint={session.current_sprint}
            stories={stories.stories}
            members={members}
            participant={participant!}
            pointsMap={pointsMap}
            onClaim={stories.claimStory}
            onSetStatus={stories.setStatus}
            onUnassign={(id) => stories.updateStory(id, { assigned_to: null, status: 'backlog' })}
          />
        )
      case 'demo':
        return (
          <DemoPage
            sprint={session.current_sprint}
            stories={stories.stories}
            members={members}
            participant={participant!}
            pointsMap={pointsMap}
            onClaim={stories.claimStory}
            onSetStatus={stories.setStatus}
            onUnassign={(id) => stories.updateStory(id, { assigned_to: null, status: 'backlog' })}
          />
        )
      case 'retrospective':
        return (
          <RetrospectivePage
            sprint={session.current_sprint}
            notes={retro.notes}
            members={members}
            participant={participant!}
            stories={stories.stories}
            priorityMap={priorityMap}
            pointsMap={pointsMap}
            onAddNote={(note) => retro.addNote(session.current_sprint, note, participant!.id)}
            onAddStory={stories.addStory}
            onUpdateStory={stories.updateStory}
          />
        )
      case 'complete':
        return <CompletePage stories={stories.stories} members={members} priorityMap={priorityMap} pointsMap={pointsMap} />
    }
  }

  return (
    <Layout participant={participant} session={session} onSwitchUser={switchUser}>
      {isFacilitator(participant) && (
        <FacilitatorControls
          session={session}
          priorityProgress={rankings.progress}
          estimateProgress={estimates.progress}
          onAdvance={advanceStage}
          onReset={handleReset}
        />
      )}
      {(stories.error || sessionError || rankings.error || estimates.error || retro.error) && (
        <p className="error-banner">
          {stories.error ?? sessionError ?? rankings.error ?? estimates.error ?? retro.error}
        </p>
      )}
      {renderStage()}
    </Layout>
  )
}

export default App
