import { useMemo, useState } from 'react'
import type { Story, TeamMember } from '../types/database'
import { CategoryTagList } from '../components/CategoryTag'
import { PersonName } from '../components/PersonName'

interface BacklogPageProps {
  stories: Story[]
  members: TeamMember[]
  priorityMap: Record<string, number>
  pointsMap: Record<string, number>
}

type SortKey = 'priority' | 'category' | 'points' | 'assignee'

function nameOf(members: TeamMember[], id: string | null): string | null {
  if (!id) return null
  return members.find((m) => m.id === id)?.name ?? 'Unknown'
}

export function BacklogPage({ stories, members, priorityMap, pointsMap }: BacklogPageProps) {
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [asc, setAsc] = useState(true)

  const sorted = useMemo(() => {
    const copy = [...stories]
    copy.sort((a, b) => {
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
          diff = (nameOf(members, a.assigned_to) ?? '').localeCompare(nameOf(members, b.assigned_to) ?? '')
          break
      }
      return asc ? diff : -diff
    })
    return copy
  }, [stories, sortKey, asc, priorityMap, pointsMap, members])

  function headerClick(key: SortKey) {
    if (key === sortKey) {
      setAsc((a) => !a)
    } else {
      setSortKey(key)
      setAsc(true)
    }
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
              <th onClick={() => headerClick('assignee')}>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((story) => {
              const assignee = nameOf(members, story.assigned_to)
              return (
                <tr key={story.id}>
                  <td>{priorityMap[story.id] ?? '—'}</td>
                  <td>{story.full_story}</td>
                  <td>
                    <CategoryTagList categories={story.categories} />
                  </td>
                  <td>{pointsMap[story.id] ?? '—'}</td>
                  <td>{assignee ? <PersonName name={assignee} /> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
