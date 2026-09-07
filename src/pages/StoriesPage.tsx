import type { Category, Story, TeamMember } from '../types/database'
import { StoryForm } from '../components/StoryForm'
import { Backlog } from '../components/Backlog'
import { CityVision } from '../components/CityVision'
import { threeStoryProgress } from '../lib/permissions'

interface StoriesPageProps {
  stories: Story[]
  members: TeamMember[]
  participant: TeamMember
  onAddStory: (input: {
    actor: string
    want: string
    benefit: string
    category: Category
    createdBy: string
  }) => Promise<{ ok: true } | { ok: false; error: string }>
}

export function StoriesPage({ stories, members, participant, onAddStory }: StoriesPageProps) {
  const progress = threeStoryProgress(members, stories)

  return (
    <div className="stack">
      <CityVision />

      <div className="card">
        <h2>Story Progress</h2>
        <p className="hint">Each person should contribute at least three user stories.</p>
        <ul className="progress-list">
          {progress.map(({ member, count, done }) => (
            <li key={member.id}>
              {member.name}: {count} / 3 {done ? '✓' : ''}
            </li>
          ))}
        </ul>
      </div>

      <StoryForm onSubmit={(input) => onAddStory({ ...input, createdBy: participant.id })} />

      <h2>Product Backlog</h2>
      <Backlog stories={stories} members={members} />
    </div>
  )
}
