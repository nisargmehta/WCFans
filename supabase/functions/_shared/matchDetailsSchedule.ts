const PREMATCH_REFRESH_MINUTES = [55, 30]
const PREMATCH_LINEUP_WINDOW_MINUTES = 60
const PREMATCH_LINEUP_REFRESH_INTERVAL_MS = 5 * 60 * 1000
const LIVE_REFRESH_INTERVAL_MS = 60 * 1000
const INTERRUPTED_MATCH_REFRESH_INTERVAL_MS = 5 * 60 * 1000
const TERMINAL_SCORE_REFRESH_INTERVAL_MS = 5 * 60 * 1000
const INTERRUPTED_MATCH_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'SUSPENDED'])
const TERMINAL_STATUSES = new Set(['FINISHED', 'AWARDED', 'CANCELLED', 'CANCELED', 'POSTPONED'])

export type FixtureRow = {
  match_id: string
  kickoff_at: string
  status: string | null
  football_data_match_id: number | null
  match_details_last_checked_at: string | null
  home_lineup: unknown[] | null
  away_lineup: unknown[] | null
  home_score: number | null
  away_score: number | null
  score_winner: string | null
  score_detail: Record<string, unknown> | null
}

type ScheduleOptions = {
  liveWindowMinutes: number
  interruptedMatchRecoveryWindowMinutes: number
  terminalScoreWindowMinutes: number
}

const asDate = (value: string | null) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const hasPublishedLineups = (fixture: FixtureRow) =>
  (Array.isArray(fixture.home_lineup) && fixture.home_lineup.length > 0) ||
  (Array.isArray(fixture.away_lineup) && fixture.away_lineup.length > 0)

const hasFullTimeScore = (fixture: FixtureRow) =>
  typeof fixture.home_score === 'number' && typeof fixture.away_score === 'number'

const hasTeamWinner = (fixture: FixtureRow) =>
  fixture.score_winner === 'HOME_TEAM' || fixture.score_winner === 'AWAY_TEAM'

const getScoreDuration = (fixture: FixtureRow) => {
  const duration = fixture.score_detail?.duration

  return typeof duration === 'string' ? duration.toUpperCase() : null
}

const hasCompleteFinalResult = (fixture: FixtureRow) => {
  if (!hasFullTimeScore(fixture)) {
    return false
  }

  if (fixture.home_score !== fixture.away_score || hasTeamWinner(fixture)) {
    return true
  }

  return getScoreDuration(fixture) === 'REGULAR'
}

export const getMatchDetailsDueReason = (fixture: FixtureRow, now: Date, options: ScheduleOptions) => {
  if (!fixture.football_data_match_id) {
    return null
  }

  const kickoffAt = asDate(fixture.kickoff_at)
  if (!kickoffAt) {
    return null
  }

  const lastCheckedAt = asDate(fixture.match_details_last_checked_at)
  const lastCheckedTime = lastCheckedAt?.getTime() ?? 0
  const nowTime = now.getTime()
  const kickoffTime = kickoffAt.getTime()

  if (fixture.status && TERMINAL_STATUSES.has(fixture.status)) {
    if (fixture.status !== 'FINISHED' || hasCompleteFinalResult(fixture)) {
      return null
    }

    const terminalScoreWindowEndsAt = kickoffTime + options.terminalScoreWindowMinutes * 60 * 1000
    if (nowTime > terminalScoreWindowEndsAt) {
      return null
    }

    return nowTime - lastCheckedTime >= TERMINAL_SCORE_REFRESH_INTERVAL_MS ? 'terminal-score' : null
  }

  if (nowTime < kickoffTime) {
    const lineupWindowStart = kickoffTime - PREMATCH_LINEUP_WINDOW_MINUTES * 60 * 1000
    if (!hasPublishedLineups(fixture) && nowTime >= lineupWindowStart) {
      const hasNeverChecked = lastCheckedTime === 0
      const refreshIntervalElapsed = nowTime - lastCheckedTime >= PREMATCH_LINEUP_REFRESH_INTERVAL_MS

      if (hasNeverChecked || refreshIntervalElapsed) {
        return 'prematch-lineups'
      }
    }

    const duePrematchRefresh = PREMATCH_REFRESH_MINUTES.some((minutesBeforeKickoff) => {
      const targetTime = kickoffTime - minutesBeforeKickoff * 60 * 1000
      return nowTime >= targetTime && lastCheckedTime < targetTime
    })

    return duePrematchRefresh ? 'prematch' : null
  }

  const liveWindowEndsAt = kickoffTime + options.liveWindowMinutes * 60 * 1000
  if (nowTime <= liveWindowEndsAt) {
    return nowTime - lastCheckedTime >= LIVE_REFRESH_INTERVAL_MS ? 'live' : null
  }

  if (!fixture.status || !INTERRUPTED_MATCH_STATUSES.has(fixture.status)) {
    return null
  }

  const recoveryWindowEndsAt = kickoffTime + options.interruptedMatchRecoveryWindowMinutes * 60 * 1000
  if (nowTime > recoveryWindowEndsAt) {
    return null
  }

  return nowTime - lastCheckedTime >= INTERRUPTED_MATCH_REFRESH_INTERVAL_MS ? 'interrupted-match-recovery' : null
}
