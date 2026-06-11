import { describe, expect, it } from 'vitest'
import { buildDashboardPayload, diversifyNewsBySource } from './api'

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
    const lineupMatch = {
      ...baseMatch,
      id: 'lineup-match',
      kickoffAt: '2026-06-11T20:00:00Z',
      status: 'Scheduled',
      details: {
        homeLineup: [{ id: 1, name: 'Mexico Keeper' }],
        awayLineup: [],
      },
    }
    const refereeMatch = {
      ...baseMatch,
      id: 'referee-match',
      kickoffAt: '2026-06-11T21:00:00Z',
      status: 'Scheduled',
      details: {
        referees: [{ id: 11412, name: 'Wilton Sampaio', type: 'REFEREE' }],
      },
    }
    const finalMatch = {
      ...baseMatch,
      id: 'final-match',
      kickoffAt: '2026-06-10T19:00:00Z',
      status: 'Final',
    }

    const payload = buildDashboardPayload({
      matches: [scheduledMatch, refereeMatch, lineupMatch, liveMatch, finalMatch],
      news: [],
      haircutTracker: [],
      standings: [],
    })

    expect(payload.liveMatches.map((match) => match.id)).toEqual(['live-match', 'lineup-match', 'referee-match'])
    expect(payload.upcomingMatches.map((match) => match.id)).toEqual(['scheduled-match'])
    expect(payload.scheduleMatches.map((match) => match.id)).toEqual([
      'final-match',
      'live-match',
      'lineup-match',
      'referee-match',
      'scheduled-match',
    ])
  })

  it('surfaces up to thirty news stories', () => {
    const news = Array.from({ length: 35 }, (_, index) => ({ id: `story-${index}` }))

    const payload = buildDashboardPayload({
      matches: [],
      news,
      haircutTracker: [],
      standings: [],
    })

    expect(payload.news).toHaveLength(30)
    expect(payload.news[29].id).toBe('story-29')
  })

  it('limits one source from dominating the top news slots without changing each source order', () => {
    const news = [
      ...Array.from({ length: 8 }, (_, index) => ({ id: `espn-${index}`, source: 'ESPN' })),
      { id: 'guardian-0', source: 'The Guardian' },
      { id: 'bbc-0', source: 'BBC Sport' },
    ]

    expect(diversifyNewsBySource(news, 8).map((article) => article.id)).toEqual([
      'espn-0',
      'espn-1',
      'espn-2',
      'guardian-0',
      'bbc-0',
      'espn-3',
      'espn-4',
      'espn-5',
    ])
  })
})
