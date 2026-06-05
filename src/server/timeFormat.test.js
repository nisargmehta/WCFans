import { describe, expect, it } from 'vitest'
import { formatKickoffTime } from './timeFormat'

describe('timeFormat', () => {
  it('formats kickoff times for display', () => {
    expect(formatKickoffTime('2026-06-12T01:00:00.000Z')).not.toMatch(/UTC[+-]\d+/)
  })
})
