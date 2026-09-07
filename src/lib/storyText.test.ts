import { describe, expect, it } from 'vitest'
import { buildFullStory } from './storyText'

describe('buildFullStory', () => {
  it('builds the canonical sentence from the three fields', () => {
    expect(
      buildFullStory('parent', 'access to an affordable school', 'my children can receive an education')
    ).toBe('As a parent, I want access to an affordable school, so that my children can receive an education.')
  })

  it('trims whitespace and stray trailing periods from each field', () => {
    expect(buildFullStory('  student.  ', ' a safe bike lane. ', ' I can get to class safely. ')).toBe(
      'As a student, I want a safe bike lane, so that I can get to class safely.'
    )
  })
})
