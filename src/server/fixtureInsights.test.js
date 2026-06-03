import { describe, expect, it } from 'vitest'
import {
  buildEmptyFixturePreview,
  getPrematchPreviewJobMatches,
  mergeMatchesWithFixturePreviews,
  normalizeFixturePreview,
} from './fixtureInsights'

const match = {
  id: 'mex-rsa',
  date: '2026-06-11',
  time: '13:00 UTC-6',
  home: { name: 'Mexico' },
  away: { name: 'South Africa' },
}

describe('fixtureInsights', () => {
  it('normalizes stored Supabase preview rows for fixture cards', () => {
    const preview = normalizeFixturePreview({
      generated_at: '2026-06-10T20:00:00Z',
      refresh_label: 'Prematch preview refreshed',
      head_to_head_summary: 'Mexico lead the all-time series 2-1.',
      head_to_head_sources: [{ label: 'API-Football', url: 'https://example.com/h2h' }],
      players_to_watch: [{ summary: 'Mexico forward: 4 goals in qualifying.', sources: [] }],
      injuries: [{ summary: 'No reported injuries.', sources: [] }],
    })

    expect(preview.generatedAt).toBe('2026-06-10T20:00:00Z')
    expect(preview.headToHead.summary).toMatch(/2-1/)
    expect(preview.playersToWatch[0].summary).toMatch(/forward/)
    expect(preview.injuries[0].summary).toMatch(/no reported/i)
  })

  it('adds pending previews when no stored row exists', () => {
    const [enrichedMatch] = mergeMatchesWithFixturePreviews([match], [])

    expect(enrichedMatch.insights).toEqual(buildEmptyFixturePreview(expect.any(String)))
  })

  it('selects fixtures due within the 24-hour prematch job window', () => {
    const dueMatches = getPrematchPreviewJobMatches(
      [
        match,
        {
          ...match,
          id: 'can-qat',
          date: '2026-06-18',
          home: { name: 'Canada' },
          away: { name: 'Qatar' },
        },
      ],
      new Date('2026-06-10T20:00:00Z'),
    )

    expect(dueMatches).toHaveLength(1)
    expect(dueMatches[0].id).toBe('mex-rsa')
  })
})
