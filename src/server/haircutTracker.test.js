import { describe, expect, it } from 'vitest'
import { getCurrentWinStreak } from '../../supabase/functions/_shared/haircutTracker.ts'

describe('getCurrentWinStreak', () => {
  it('counts a win after an earlier draw', () => {
    expect(getCurrentWinStreak('W,D')).toBe(1)
  })

  it('counts consecutive wins from the newest end of form', () => {
    expect(getCurrentWinStreak('W,W,D,W')).toBe(2)
    expect(getCurrentWinStreak('D,W,W')).toBe(0)
  })

  it('handles empty and loosely formatted form values', () => {
    expect(getCurrentWinStreak(null)).toBe(0)
    expect(getCurrentWinStreak('w - w - l')).toBe(2)
  })
})
