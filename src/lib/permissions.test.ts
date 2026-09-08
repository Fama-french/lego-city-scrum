import { describe, expect, it } from 'vitest'
import {
  canAssign,
  canChangeStoryStatus,
  canEditStory,
  canOverridePoints,
  canRemoveAssignee,
  isFacilitator,
  isKanbanAdmin,
  threeStoryProgress,
} from './permissions'
import type { Story, TeamMember } from '../types/database'

const leo: TeamMember = { id: 'leo-id', name: 'Leo', role: 'Developer / Facilitator', auth_user_id: 'auth-leo', created_at: '' }
const gbenro: TeamMember = { id: 'gbenro-id', name: 'Gbenro', role: 'Product Owner', auth_user_id: 'auth-gbenro', created_at: '' }
const ayush: TeamMember = { id: 'ayush-id', name: 'Ayush', role: 'Scrum Master', auth_user_id: 'auth-ayush', created_at: '' }
const austin: TeamMember = { id: 'austin-id', name: 'Austin', role: 'Developer', auth_user_id: 'auth-austin', created_at: '' }
const jessica: TeamMember = { id: 'jessica-id', name: 'Jessica', role: 'Developer', auth_user_id: 'auth-jessica', created_at: '' }
const sije: TeamMember = { id: 'sije-id', name: 'Sije', role: 'Developer', auth_user_id: 'auth-sije', created_at: '' }

function makeStory(overrides: Partial<Story>): Story {
  return {
    id: 's1',
    actor: 'parent',
    want: 'a school',
    benefit: 'education',
    full_story: 'As a parent, I want a school, so that education.',
    categories: ['Education'],
    created_by: jessica.id,
    assignees: [],
    status: 'backlog',
    sprint: null,
    points_override: null,
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

describe('isKanbanAdmin', () => {
  it('is true for Leo, Gbenro, and Austin', () => {
    expect(isKanbanAdmin(leo)).toBe(true)
    expect(isKanbanAdmin(gbenro)).toBe(true)
    expect(isKanbanAdmin(austin)).toBe(true)
  })

  it('is false for everyone else', () => {
    expect(isKanbanAdmin(jessica)).toBe(false)
    expect(isKanbanAdmin(sije)).toBe(false)
    expect(isKanbanAdmin(null)).toBe(false)
  })
})

describe('canAssign', () => {
  it('lets anyone assign themselves', () => {
    expect(canAssign(jessica, jessica.id)).toBe(true)
  })

  it('blocks a non-admin from assigning someone else', () => {
    expect(canAssign(jessica, sije.id)).toBe(false)
  })

  it('lets an admin assign anyone', () => {
    expect(canAssign(austin, jessica.id)).toBe(true)
    expect(canAssign(gbenro, sije.id)).toBe(true)
  })
})

describe('canRemoveAssignee', () => {
  it('lets anyone remove themselves', () => {
    expect(canRemoveAssignee(jessica, jessica.id)).toBe(true)
  })

  it('blocks a non-admin from removing someone else', () => {
    expect(canRemoveAssignee(jessica, sije.id)).toBe(false)
  })

  it('lets an admin remove anyone', () => {
    expect(canRemoveAssignee(leo, sije.id)).toBe(true)
  })
})

describe('canChangeStoryStatus', () => {
  it('lets an assignee change status', () => {
    expect(canChangeStoryStatus(jessica, makeStory({ assignees: [jessica.id] }))).toBe(true)
  })

  it('blocks someone who is not assigned and not an admin', () => {
    expect(canChangeStoryStatus(sije, makeStory({ assignees: [jessica.id] }))).toBe(false)
  })

  it('lets an admin change status regardless of assignment', () => {
    expect(canChangeStoryStatus(austin, makeStory({ assignees: [jessica.id] }))).toBe(true)
  })
})

describe('canOverridePoints', () => {
  it('is true for Ayush, Gbenro, and Leo', () => {
    expect(canOverridePoints(ayush)).toBe(true)
    expect(canOverridePoints(gbenro)).toBe(true)
    expect(canOverridePoints(leo)).toBe(true)
  })

  it('is false for everyone else', () => {
    expect(canOverridePoints(austin)).toBe(false)
    expect(canOverridePoints(jessica)).toBe(false)
    expect(canOverridePoints(sije)).toBe(false)
    expect(canOverridePoints(null)).toBe(false)
  })
})

describe('canEditStory', () => {
  it('lets the creator edit their own story', () => {
    expect(canEditStory(jessica, makeStory({ created_by: jessica.id }))).toBe(true)
  })

  it('lets an assignee edit even if they did not create it', () => {
    expect(canEditStory(sije, makeStory({ created_by: jessica.id, assignees: [sije.id] }))).toBe(true)
  })

  it('blocks an unrelated developer', () => {
    expect(canEditStory(sije, makeStory({ created_by: jessica.id, assignees: [] }))).toBe(false)
  })

  it('always lets Leo edit', () => {
    expect(canEditStory(leo, makeStory({ created_by: jessica.id }))).toBe(true)
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
