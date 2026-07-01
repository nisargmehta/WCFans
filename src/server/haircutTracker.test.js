import { describe, expect, it } from 'vitest'
import { buildTeamResultForms, getCurrentWinStreak } from '../../supabase/functions/_shared/haircutTracker.ts'

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

describe('buildTeamResultForms', () => {
  it('includes completed knockout wins after group-stage wins', () => {
    const forms = buildTeamResultForms([
      finishedMatch({ utcDate: '2026-06-13T00:00:00Z', homeId: 1, awayId: 2, winner: 'HOME_TEAM', homeScore: 2, awayScore: 0 }),
      finishedMatch({ utcDate: '2026-06-18T00:00:00Z', homeId: 3, awayId: 1, winner: 'AWAY_TEAM', homeScore: 0, awayScore: 1 }),
      finishedMatch({ utcDate: '2026-06-24T00:00:00Z', homeId: 1, awayId: 4, winner: 'HOME_TEAM', homeScore: 3, awayScore: 1 }),
      finishedMatch({ utcDate: '2026-06-30T00:00:00Z', homeId: 5, awayId: 1, winner: 'AWAY_TEAM', homeScore: 1, awayScore: 2 }),
    ])

    expect(forms.get(1)).toBe('WWWW')
    expect(getCurrentWinStreak(forms.get(1))).toBe(4)
  })

  it('counts the provider winner as the winning team for penalty shootouts', () => {
    const forms = buildTeamResultForms([
      finishedMatch({ utcDate: '2026-06-30T00:00:00Z', homeId: 1, awayId: 2, winner: 'AWAY_TEAM', homeScore: 1, awayScore: 1 }),
    ])

    expect(forms.get(1)).toBe('L')
    expect(forms.get(2)).toBe('W')
  })

  it('uses penalty totals when the provider winner is still reported as a draw', () => {
    const forms = buildTeamResultForms([
      {
        utcDate: '2026-06-30T00:00:00Z',
        status: 'FINISHED',
        homeTeam: { id: 1 },
        awayTeam: { id: 2 },
        score: {
          winner: 'DRAW',
          fullTime: { home: 1, away: 1 },
          penalties: { home: 3, away: 4 },
        },
      },
    ])

    expect(forms.get(1)).toBe('L')
    expect(forms.get(2)).toBe('W')
  })

  it('ignores in-progress matches', () => {
    const forms = buildTeamResultForms([
      {
        utcDate: '2026-06-30T00:00:00Z',
        status: 'IN_PLAY',
        homeTeam: { id: 1 },
        awayTeam: { id: 2 },
        score: { winner: 'HOME_TEAM', fullTime: { home: 2, away: 0 } },
      },
    ])

    expect(forms.size).toBe(0)
  })
})

function finishedMatch({ utcDate, homeId, awayId, winner, homeScore, awayScore }) {
  return {
    utcDate,
    status: 'FINISHED',
    homeTeam: { id: homeId },
    awayTeam: { id: awayId },
    score: {
      winner,
      fullTime: {
        home: homeScore,
        away: awayScore,
      },
    },
  }
}
