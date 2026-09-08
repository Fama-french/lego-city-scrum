import { describe, expect, it } from 'vitest'
import { canClaimStory, canEditStory, isFacilitator, threeStoryProgress } from './permissions'
import type { Story, TeamMember } from '../types/database'

const leo: TeamMember = {
  id: 'leo-id',
  name: 'Leo',
  role: 'Developer / Facilitator',
  auth_user_id: 'auth-leo',
  created_at: '',
}
const austin: TeamMember = {
  id: 'austin-id',
  name: 'Austin',
  role: 'Developer',
  auth_user_id: 'auth-austin',
  created_at: '',
}
const jessica: TeamMember = {
  id: 'jessica-id',
  name: 'Jessica',
  role: 'Developer',
  auth_user_id: 'auth-jessica',
  created_at: '',
}

function makeStory(overrides: Partial<Story>): Story {
  return {
    id: 's1',
    actor: 'parent',
    want: 'a school',
    benefit: 'education',
    full_story: 'As a parent, I want a school, so that education.',
    categories: ['Education'],
    created_by: austin.id,
    assigned_to: null,
    status: 'backlog',
    sprint: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('isFacilitator', () => {
  it('is true only for Leo', () => {
    expect(isFacilitator(leo)).toBe(true)
    expect(isFacilitator(austin)).toBe(false)
    expect(isFacilitator(null)).toBe(false)
  })
})

describe('canClaimStory', () => {
  it('allows anyone to claim an unassigned story', () => {
    expect(canClaimStory(austin, makeStory({ assigned_to: null }))).toBe(true)
  })

  it('blocks a non-facilitator from claiming an already-assigned story', () => {
    expect(canClaimStory(jessica, makeStory({ assigned_to: austin.id }))).toBe(false)
  })

  it('lets Leo claim/reassign regardless of current assignment', () => {
    expect(canClaimStory(leo, makeStory({ assigned_to: austin.id }))).toBe(true)
  })
})

describe('canEditStory', () => {
  it('lets the creator edit their own story', () => {
    expect(canEditStory(austin, makeStory({ created_by: austin.id }))).toBe(true)
  })

  it('lets the assignee edit even if they did not create it', () => {
    expect(canEditStory(jessica, makeStory({ created_by: austin.id, assigned_to: jessica.id }))).toBe(true)
  })

  it('blocks an unrelated developer', () => {
    expect(canEditStory(jessica, makeStory({ created_by: austin.id, assigned_to: null }))).toBe(false)
  })

  it('always lets Leo edit', () => {
    expect(canEditStory(leo, makeStory({ created_by: austin.id }))).toBe(true)
  })
})

describe('threeStoryProgress', () => {
  it('counts stories per member and flags 3+ as done', () => {
    const stories = [
      makeStory({ id: '1', created_by: austin.id }),
      makeStory({ id: '2', created_by: austin.id }),
      makeStory({ id: '3', created_by: austin.id }),
      makeStory({ id: '4', created_by: jessica.id }),
    ]
    const progress = threeStoryProgress([austin, jessica], stories)
    expect(progress).toEqual([
      { member: austin, count: 3, done: true },
      { member: jessica, count: 1, done: false },
    ])
  })
})
