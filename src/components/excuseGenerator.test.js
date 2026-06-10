import { describe, expect, it } from 'vitest'
import { buildExcuseOptions, buildExcuseShareText, getLosingSide } from './excuseGenerator'

const baseMatch = {
  id: 'usa-par-final',
  round: 'Matchday 1',
  group: 'Group D',
  status: 'Final',
  home: { name: 'United States', code: 'USA', flag: '🇺🇸' },
  away: { name: 'Paraguay', code: 'PAR', flag: '🇵🇾' },
  score: { home: 2, away: 1 },
  details: {
    homeStatistics: { ball_possession: 38, corner_kicks: 2, shots: 5 },
    awayStatistics: { ball_possession: 62, corner_kicks: 3, shots: 11 },
  },
}

describe('excuseGenerator', () => {
  it('only exposes a losing side for final matches with a winner', () => {
    expect(getLosingSide(baseMatch)).toBe('away')
    expect(getLosingSide({ ...baseMatch, status: 'Live' })).toBeNull()
    expect(getLosingSide({ ...baseMatch, score: { home: 1, away: 1 } })).toBeNull()
  })

  it('prioritizes possession-based excuses when the losing team dominated the ball', () => {
    const excuses = buildExcuseOptions(baseMatch, 'away')

    expect(excuses[0]).toMatch(/only one team was playing football/i)
  })

  it('adds a set-piece excuse when the winning opponent had a corner-heavy match', () => {
    const match = {
      ...baseMatch,
      details: {
        homeStatistics: { ball_possession: 50, corner_kicks: 8 },
        awayStatistics: { ball_possession: 50, corner_kicks: 3 },
      },
    }

    expect(buildExcuseOptions(match, 'away')).toContain(
      'United States relied too much on set pieces. Take away the corners and what was left?',
    )
  })

  it('falls back to generic excuses when stats do not suggest a specific angle', () => {
    const excuses = buildExcuseOptions({ ...baseMatch, details: {} }, 'away')

    expect(excuses).toContain('The ref was biased and everyone watching knows it.')
  })

  it('formats share copy with the matchup and excuse', () => {
    expect(buildExcuseShareText(baseMatch, 'away', 'The ref was biased.')).toBe(
      'Paraguay vs United States (2-1): The ref was biased. #WCFans',
    )
  })
})
