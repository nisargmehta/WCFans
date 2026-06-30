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

  it('preserves provider winner details for penalty shootout finals', () => {
    const [match] = mapFixtureRowsToMatches([
      {
        match_id: 'penalty-final',
        kickoff_at: '2026-06-29T20:30:00Z',
        home_team: 'Germany',
        away_team: 'Paraguay',
        group_name: 'Last 32',
        round_name: 'Last 32',
        ground: 'Test Stadium',
        status: 'FINISHED',
        minute: null,
        home_score: 5,
        away_score: 5,
        score_winner: null,
        score_detail: {
          winner: 'AWAY_TEAM',
          duration: 'PENALTY_SHOOTOUT',
          penalties: { home: 4, away: 5 },
        },
      },
    ])

    expect(match.winner).toBe('AWAY_TEAM')
    expect(match.score).toMatchObject({
      home: 5,
      away: 5,
      winner: 'AWAY_TEAM',
      duration: 'PENALTY_SHOOTOUT',
      penalties: { home: 4, away: 5 },
    })
  })

  it('applies known shootout result overrides when the provider row is incomplete', () => {
    const [match] = mapFixtureRowsToMatches([
      {
        match_id: '537418',
        kickoff_at: '2026-06-30T01:00:00Z',
        home_team: 'Netherlands',
        away_team: 'Morocco',
        group_name: 'Last 32',
        round_name: 'Last 32',
        ground: 'Test Stadium',
        status: 'FINISHED',
        minute: null,
        home_score: 1,
        away_score: 1,
        score_winner: 'DRAW',
        score_detail: {
          winner: 'DRAW',
          duration: 'EXTRA_TIME',
        },
      },
    ])

    expect(match.winner).toBe('AWAY_TEAM')
    expect(match.score).toMatchObject({
      home: 1,
      away: 1,
      winner: 'AWAY_TEAM',
      duration: 'PENALTY_SHOOTOUT',
    })
  })
})
