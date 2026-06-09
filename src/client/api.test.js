import { describe, expect, it } from 'vitest'
import { buildDashboardPayload } from './api'

const baseMatch = {
  round: 'Matchday 1',
  group: 'Group A',
  date: '2026-06-11',
  time: '13:00 UTC-6',
  ground: 'Mexico City',
  minute: null,
  home: { name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
  away: { name: 'South Africa', code: 'RSA', flag: '🇿🇦' },
  score: { home: null, away: null },
  events: [],
}

describe('buildDashboardPayload', () => {
  it('keeps live matches out of upcoming fixtures', () => {
    const liveMatch = {
      ...baseMatch,
      id: 'live-match',
      kickoffAt: '2026-06-11T19:00:00Z',
      status: 'Live',
      minute: 32,
      score: { home: 1, away: 0 },
    }
    const scheduledMatch = {
      ...baseMatch,
      id: 'scheduled-match',
      kickoffAt: '2026-06-12T19:00:00Z',
      status: 'Scheduled',
    }
    const finalMatch = {
      ...baseMatch,
      id: 'final-match',
      kickoffAt: '2026-06-10T19:00:00Z',
      status: 'Final',
    }

    const payload = buildDashboardPayload({
      matches: [scheduledMatch, liveMatch, finalMatch],
      news: [],
      fixturePreviews: [],
      haircutTracker: [],
      standings: [],
    })

    expect(payload.liveMatches.map((match) => match.id)).toEqual(['live-match'])
    expect(payload.upcomingMatches.map((match) => match.id)).toEqual(['scheduled-match'])
    expect(payload.scheduleMatches.map((match) => match.id)).toEqual([
      'final-match',
      'live-match',
      'scheduled-match',
    ])
  })
})
