// Types mirroring the Supabase/Postgres schema. Kept intentionally close to the
// SQL in supabase/migrations/001_initial_schema.sql so the two stay easy to compare.

export type Role = 'Product Owner' | 'Scrum Master' | 'Developer' | 'Developer / Facilitator'

export interface TeamMember {
  id: string
  name: string
  role: Role
  auth_user_id: string | null
  created_at: string
}

export type Stage =
  | 'join'
  | 'stories'
  | 'prioritization'
  | 'estimation'
  | 'backlog'
  | 'sprint_planning'
  | 'sprint'
  | 'demo'
  | 'retrospective'
  | 'complete'

export interface ClassroomSession {
  id: string
  current_stage: Stage
  current_sprint: number
  priority_revealed: boolean
  estimates_revealed: boolean
  created_at: string
  updated_at: string
}

export const CATEGORIES = [
  'Safety',
  'Housing',
  'Transportation',
  'Education',
  'Entertainment',
  'Public Services',
  'Community',
  'Environment',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const ACTOR_SUGGESTIONS = [
  'parent',
  'student',
  'elderly resident',
  'low-income family',
  'commuter',
  'child',
  'teacher',
  'resident',
  'person with disability',
  'business owner',
] as const

export type StoryStatus = 'backlog' | 'in_progress' | 'done'

export interface Story {
  id: string
  actor: string
  want: string
  benefit: string
  full_story: string
  category: Category
  created_by: string
  assigned_to: string | null
  status: StoryStatus
  sprint: number | null
  created_at: string
  updated_at: string
}

export const STORY_POINTS = [1, 2, 3, 5, 8, 13] as const
export type StoryPoints = (typeof STORY_POINTS)[number]

export interface Ranking {
  id: string
  story_id: string
  participant_id: string
  rank: number
  created_at: string
  updated_at: string
}

export interface Estimate {
  id: string
  story_id: string
  participant_id: string
  points: StoryPoints
  created_at: string
  updated_at: string
}

export interface RetroNote {
  id: string
  sprint: number
  author_id: string
  note: string
  created_at: string
}

export interface ProgressRow {
  participant_id: string
  name: string
  complete: boolean
}

export interface TeamPriorityRow {
  story_id: string
  average_rank: number
  submissions: number
}

export interface TeamEstimateRow {
  story_id: string
  median_points: number
  submissions: number
}
