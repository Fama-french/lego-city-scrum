import type { Category } from '../types/database'

// Fixed, hand-picked colors (not hashed/random) so the same category or
// person always reads the same color to everyone, every session. Chosen dark
// enough to keep sufficient contrast as text/borders on a white background.

export const CATEGORY_COLORS: Record<Category, string> = {
  Safety: '#c1121f',
  Housing: '#9c5700',
  Transportation: '#8a7500',
  Education: '#2e7d32',
  Entertainment: '#00796b',
  'Public Services': '#1565c0',
  Community: '#6a1b9a',
  Environment: '#558b2f',
  Other: '#616161',
}

export function categoryColor(category: Category): string {
  return CATEGORY_COLORS[category] ?? '#616161'
}

const MEMBER_COLORS: Record<string, string> = {
  Gbenro: '#ad1457',
  Ayush: '#4527a0',
  Austin: '#00838f',
  Sije: '#ef6c00',
  Leo: '#283593',
  Jessica: '#6d4c41',
}

export function memberColor(name: string): string {
  return MEMBER_COLORS[name] ?? '#424242'
}
