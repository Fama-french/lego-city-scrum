import { useMemo, useState } from 'react'
import { useParticipant } from './hooks/useParticipant'
import { useSession } from './hooks/useSession'
import { useStories } from './hooks/useStories'
import { useRankings } from './hooks/useRankings'
import { useEstimates } from './hooks/useEstimates'
import { useRetroNotes } from './hooks/useRetroNotes'
import { assignPriorityPositions } from './lib/aggregation'
import { canHideStory, canOverridePoints, canOverridePriority, isFacilitator } from './lib/permissions'
import { Layout } from './components/Layout'
import { FacilitatorControls } from './components/FacilitatorControls'
import { PointsReviewPanel } from './components/PointsReviewPanel'
import { JoinPage } from './pages/JoinPage'
import { StoriesPage } from './pages/StoriesPage'
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
  const [reviewOpen, setReviewOpen] = useState(false)

  const createdAtByStory = useMemo(
    () => Object.fromEntries(stories.stories.map((s) => [s.id, s.created_at])),
    [stories.stories]
  )

  const priorityMap = useMemo(() => {
    const map: Record<string, number> = {}
    if (rankings.teamPriority) {
      const ranked = assignPriorityPositions(
        rankings.teamPriority.map((r) => ({ storyId: r.story_id, averageRank: r.average_rank, submissions: r.submissions })),
        createdAtByStory
      )
      for (const r of ranked) map[r.storyId] = r.priority
    }
    for (const story of stories.stories) {
      if (story.priority_override != null) map[story.id] = story.priority_override
    }
    return map
  }, [rankings.teamPriority, createdAtByStory, stories.stories])

  const pointsMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of estimates.teamEstimates ?? []) {
      map[r.story_id] = r.median_points
    }
    for (const story of stories.stories) {
      if (story.points_override != null) map[story.id] = story.points_override
    }
    return map
  }, [estimates.teamEstimates, stories.stories])

  async function handleReset(): Promise<{ ok: true } | { ok: false; error: string }> {
    const { error } = await supabase.rpc('reset_classroom')
    if (error) {
      const hint = error.message.includes('Leo')
        ? ' If you are Leo but keep seeing this, use "Switch user" and rejoin as Leo, then try again.'
        : ''
      return { ok: false, error: `${error.message}${hint}` }
    }
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
      case 'stories':
      // Legacy stage values from before stories/ranking/estimating were
      // merged into one self-paced phase; treat them the same way so any
      // session left mid-flow from an older version doesn't get stuck.
      case 'prioritization':
      case 'estimation':
        return (
          <StoriesPage
            stories={stories.stories}
            members={members}
            participant={participant!}
            onAddStory={stories.addStory}
            myRanking={rankings.myRanking}
            rankingProgress={rankings.progress}
            onSubmitRanking={(order) => rankings.submitRanking(order, participant!.id)}
            myEstimates={estimates.myEstimates}
            estimateProgress={estimates.progress}
            onSubmitEstimate={(storyId, points) => estimates.submitEstimate(storyId, points, participant!.id)}
          />
        )
      case 'backlog':
        return (
          <BacklogPage
            stories={stories.stories}
            members={members}
            priorityMap={priorityMap}
            pointsMap={pointsMap}
            canOverridePoints={canOverridePoints(participant!)}
            onSetPointsOverride={stories.setPointsOverride}
            canOverridePriority={canOverridePriority(participant!)}
            onSetPriorityOverride={stories.setPriorityOverride}
            canHideStory={canHideStory(participant!)}
            onSetDeprioritized={stories.setDeprioritized}
          />
        )
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
            priorityMap={priorityMap}
            onAddAssignee={stories.addAssignee}
            onRemoveAssignee={stories.removeAssignee}
            onSetStatus={stories.setStatus}
            onSetPointsOverride={stories.setPointsOverride}
            onSetPriorityOverride={stories.setPriorityOverride}
            onSetDeprioritized={stories.setDeprioritized}
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
            priorityMap={priorityMap}
            onAddAssignee={stories.addAssignee}
            onRemoveAssignee={stories.removeAssignee}
            onSetStatus={stories.setStatus}
            onSetPointsOverride={stories.setPointsOverride}
            onSetPriorityOverride={stories.setPriorityOverride}
            onSetDeprioritized={stories.setDeprioritized}
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
            onSetPointsOverride={stories.setPointsOverride}
            onSetPriorityOverride={stories.setPriorityOverride}
            onSetDeprioritized={stories.setDeprioritized}
          />
        )
      case 'complete':
        return <CompletePage stories={stories.stories} members={members} priorityMap={priorityMap} pointsMap={pointsMap} />
    }
  }

  return (
    <Layout participant={participant} session={session} onSwitchUser={switchUser} onReviewPoints={() => setReviewOpen(true)}>
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
      {reviewOpen && canOverridePoints(participant) && (
        <PointsReviewPanel
          stories={stories.stories}
          totalParticipants={members.length}
          onClose={() => setReviewOpen(false)}
          onFetch={estimates.fetchPointSubmissions}
          onSetOverride={stories.setPointsOverride}
        />
      )}
    </Layout>
  )
}

export default App
