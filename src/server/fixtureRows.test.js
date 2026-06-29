import { describe, expect, it } from 'vitest'
import { mapFixtureRowsToMatches } from './fixtureRows'

describe('mapFixtureRowsToMatches', () => {
  it('falls back to the local World Cup ground when Supabase has no ground value', () => {
    const [match] = mapFixtureRowsToMatches([
      {
        match_id: '537327',
        kickoff_at: '2026-06-13T01:00:00Z',
        home_team: 'United States',
        away_team: 'Paraguay',
        group_name: 'Group D',
        round_name: 'Matchday 1',
        ground: null,
        status: 'FINISHED',
        minute: null,
        home_score: 4,
        away_score: 1,
      },
    ])

    expect(match.ground).toBe('Los Angeles (Inglewood)')
    expect(match.home.code).toBe('USA')
    expect(match.home.flag).toBe('🇺🇸')
  })
})
