import { describe, expect, it } from 'vitest'
import { assignPriorityPositions, computeTeamPriority, medianPoints } from './aggregation'

describe('computeTeamPriority', () => {
  it('matches the worked example from the spec', () => {
    // Story A: 1, 2, 1, 3, 1, 2 -> average 1.6666...
    const entries = [
      { storyId: 'A', rank: 1 },
      { storyId: 'A', rank: 2 },
      { storyId: 'A', rank: 1 },
      { storyId: 'A', rank: 3 },
      { storyId: 'A', rank: 1 },
      { storyId: 'A', rank: 2 },
    ]
    const [result] = computeTeamPriority(entries, { A: '2024-01-01T00:00:00Z' })
    expect(result.averageRank).toBeCloseTo(1.6667, 3)
    expect(result.priority).toBe(1)
  })

  it('sorts ascending by average rank (lower = higher priority)', () => {
    const entries = [
      { storyId: 'A', rank: 1 },
      { storyId: 'A', rank: 2 },
      { storyId: 'A', rank: 1 },
      { storyId: 'A', rank: 3 },
      { storyId: 'B', rank: 2 },
      { storyId: 'B', rank: 1 },
      { storyId: 'B', rank: 2 },
      { storyId: 'B', rank: 1 },
    ]
    const results = computeTeamPriority(entries, {
      A: '2024-01-01T00:00:00Z',
      B: '2024-01-02T00:00:00Z',
    })
    expect(results.map((r) => r.storyId)).toEqual(['B', 'A'])
    expect(results[0].priority).toBe(1)
    expect(results[1].priority).toBe(2)
  })

  it('breaks ties using story creation time', () => {
    const entries = [
      { storyId: 'newer', rank: 2 },
      { storyId: 'older', rank: 2 },
    ]
    const results = computeTeamPriority(entries, {
      newer: '2024-02-01T00:00:00Z',
      older: '2024-01-01T00:00:00Z',
    })
    expect(results.map((r) => r.storyId)).toEqual(['older', 'newer'])
  })

  it('ignores stories with no submissions and returns empty for no entries', () => {
    expect(computeTeamPriority([], {})).toEqual([])
  })

  it('records how many participants submitted for each story', () => {
    const entries = [
      { storyId: 'A', rank: 1 },
      { storyId: 'A', rank: 2 },
    ]
    const [result] = computeTeamPriority(entries, { A: '2024-01-01T00:00:00Z' })
    expect(result.submissions).toBe(2)
  })
})

describe('assignPriorityPositions', () => {
  it('ranks pre-aggregated averages (as returned by the get_team_priority RPC)', () => {
    const results = assignPriorityPositions(
      [
        { storyId: 'A', averageRank: 1.67, submissions: 6 },
        { storyId: 'B', averageRank: 1.5, submissions: 6 },
      ],
      { A: '2024-01-01T00:00:00Z', B: '2024-01-02T00:00:00Z' }
    )
    expect(results.map((r) => r.storyId)).toEqual(['B', 'A'])
    expect(results[0].priority).toBe(1)
  })
})

describe('medianPoints', () => {
  it('matches the worked example: [3,5,5,8,5] -> 5', () => {
    expect(medianPoints([3, 5, 5, 8, 5])).toBe(5)
  })

  it('matches the worked example: [1,1,3,5,13] -> 3', () => {
    expect(medianPoints([1, 1, 3, 5, 13])).toBe(3)
  })

  it('picks the lower of the two middle values for an even-length list, never a half-point', () => {
    expect(medianPoints([1, 2, 3, 5])).toBe(2)
  })

  it('picks the lower middle even when both middle values are Fibonacci points', () => {
    // 3 and 5 average to 4, which isn't a valid point value - must return 3.
    expect(medianPoints([1, 3, 5, 8])).toBe(3)
  })

  it('returns the single value for a one-element list', () => {
    expect(medianPoints([8])).toBe(8)
  })

  it('returns null when there are no estimates', () => {
    expect(medianPoints([])).toBeNull()
  })

  it('is not affected by input order', () => {
    expect(medianPoints([13, 1, 5, 1, 3])).toBe(medianPoints([1, 1, 3, 5, 13]))
  })
})
