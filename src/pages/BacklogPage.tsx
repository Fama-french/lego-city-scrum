import { useMemo, useState } from 'react'
import type { Story, TeamMember } from '../types/database'
import { CategoryTagList } from '../components/CategoryTag'
import { PersonName } from '../components/PersonName'
import { PointsOverrideControl } from '../components/PointsOverrideControl'
import { PriorityBadge } from '../components/PriorityBadge'

interface BacklogPageProps {
  stories: Story[]
  members: TeamMember[]
  priorityMap: Record<string, number>
  pointsMap: Record<string, number>
  canOverridePoints?: boolean
  onSetPointsOverride?: (storyId: string, points: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  canOverridePriority?: boolean
  onSetPriorityOverride?: (storyId: string, priority: number | null) => Promise<{ ok: true } | { ok: false; error: string }>
  canHideStory?: boolean
  onSetDeprioritized?: (storyId: string, deprioritized: boolean) => Promise<{ ok: true } | { ok: false; error: string }>
}

type SortKey = 'priority' | 'category' | 'points' | 'assignee'

function assigneeNames(members: TeamMember[], ids: string[]): string[] {
  return ids.map((id) => members.find((m) => m.id === id)?.name ?? 'Unknown')
}

export function BacklogPage({
  stories,
  members,
  priorityMap,
  pointsMap,
  canOverridePoints,
  onSetPointsOverride,
  canOverridePriority,
  onSetPriorityOverride,
  canHideStory,
  onSetDeprioritized,
}: BacklogPageProps) {
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [asc, setAsc] = useState(true)

  const visible = stories.filter((s) => !s.deprioritized)
  const hidden = stories.filter((s) => s.deprioritized)

  const compare = useMemo(() => {
    return (a: Story, b: Story) => {
      let diff = 0
      switch (sortKey) {
        case 'priority':
          diff = (priorityMap[a.id] ?? 999) - (priorityMap[b.id] ?? 999)
          break
        case 'category':
          diff = a.categories.join(', ').localeCompare(b.categories.join(', '))
          break
        case 'points':
          diff = (pointsMap[a.id] ?? -1) - (pointsMap[b.id] ?? -1)
          break
        case 'assignee':
          diff = assigneeNames(members, a.assignees).join(', ').localeCompare(assigneeNames(members, b.assignees).join(', '))
          break
      }
      return asc ? diff : -diff
    }
  }, [sortKey, asc, priorityMap, pointsMap, members])

  const sortedVisible = useMemo(() => [...visible].sort(compare), [visible, compare])
  const sortedHidden = useMemo(() => [...hidden].sort(compare), [hidden, compare])

  function headerClick(key: SortKey) {
    if (key === sortKey) {
      setAsc((a) => !a)
    } else {
      setSortKey(key)
      setAsc(true)
    }
  }

  function renderRow(story: Story) {
    const names = assigneeNames(members, story.assignees)
    return (
      <tr key={story.id}>
        <td>
          {onSetPriorityOverride ? (
            <PriorityBadge
              story={story}
              priority={priorityMap[story.id] ?? null}
              editable={Boolean(canOverridePriority)}
              onSetOverride={onSetPriorityOverride}
            />
          ) : (
            (priorityMap[story.id] ?? '—')
          )}
        </td>
        <td>{story.full_story}</td>
        <td>
          <CategoryTagList categories={story.categories} />
        </td>
        <td>
          {pointsMap[story.id] ?? '—'}
          {story.points_override != null && ' (overridden)'}
          {canOverridePoints && onSetPointsOverride && (
            <div style={{ marginTop: '0.3rem' }}>
              <PointsOverrideControl story={story} onSetOverride={onSetPointsOverride} />
            </div>
          )}
        </td>
        <td>
          {names.length > 0
            ? names.map((name, i) => (
                <span key={name}>
                  {i > 0 && ', '}
                  <PersonName name={name} />
                </span>
              ))
            : '—'}
        </td>
        {canHideStory && onSetDeprioritized && (
          <td>
            <button className="btn btn-small" onClick={() => onSetDeprioritized(story.id, !story.deprioritized)}>
              {story.deprioritized ? 'Restore' : 'Hide'}
            </button>
          </td>
        )}
      </tr>
    )
  }

  if (stories.length === 0) {
    return <div className="empty-state">No user stories yet.</div>
  }

  return (
    <div className="stack">
      <h1>PRODUCT BACKLOG</h1>
      <p className="hint">This is the team&apos;s source of truth. Default order is team priority — click a column header to sort.</p>
      <div className="table-scroll">
        <table className="backlog-table">
          <thead>
            <tr>
              <th onClick={() => headerClick('priority')}>Priority</th>
              <th>Story</th>
              <th onClick={() => headerClick('category')}>Category</th>
              <th onClick={() => headerClick('points')}>Points</th>
              <th onClick={() => headerClick('assignee')}>Assignees</th>
              {canHideStory && onSetDeprioritized && <th></th>}
            </tr>
          </thead>
          <tbody>{sortedVisible.map(renderRow)}</tbody>
        </table>
      </div>

      {sortedHidden.length > 0 && (
        <details>
          <summary>Deprioritized ({sortedHidden.length})</summary>
          <div className="table-scroll" style={{ marginTop: '0.5rem' }}>
            <table className="backlog-table">
              <tbody>{sortedHidden.map(renderRow)}</tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
