import { describe, expect, it } from 'vitest'
import { getMatchDetailsDueReason, type FixtureRow } from './matchDetailsSchedule'

const options = {
  liveWindowMinutes: 180,
  interruptedMatchRecoveryWindowMinutes: 48 * 60,
  terminalScoreWindowMinutes: 24 * 60,
}

const fixture = (overrides: Partial<FixtureRow> = {}): FixtureRow => ({
  match_id: 'france-iraq',
  kickoff_at: '2026-06-22T12:00:00.000Z',
  status: 'IN_PLAY',
  football_data_match_id: 123,
  match_details_last_checked_at: '2026-06-22T14:55:00.000Z',
  home_lineup: [],
  away_lineup: [],
  home_score: 1,
  away_score: 0,
  ...overrides,
})

describe('getMatchDetailsDueReason', () => {
  it.each(['IN_PLAY', 'PAUSED', 'SUSPENDED'])(
    'keeps retrying an interrupted %s match after the normal live window',
    (status) => {
      expect(
        getMatchDetailsDueReason(
          fixture({ status }),
          new Date('2026-06-23T12:00:00.000Z'),
          options,
        ),
      ).toBe('interrupted-match-recovery')
    },
  )

  it('does not retry an ordinary stale scheduled fixture after the live window', () => {
    expect(
      getMatchDetailsDueReason(
        fixture({ status: 'TIMED' }),
        new Date('2026-06-23T12:00:00.000Z'),
        options,
      ),
    ).toBeNull()
  })

  it('stops interrupted-match recovery after 48 hours', () => {
    expect(
      getMatchDetailsDueReason(
        fixture(),
        new Date('2026-06-24T12:00:00.001Z'),
        options,
      ),
    ).toBeNull()
  })

  it('throttles interrupted-match recovery checks to every five minutes', () => {
    expect(
      getMatchDetailsDueReason(
        fixture({ match_details_last_checked_at: '2026-06-23T11:57:00.000Z' }),
        new Date('2026-06-23T12:00:00.000Z'),
        options,
      ),
    ).toBeNull()
  })
})
