import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const PREMATCH_REFRESH_MINUTES = [55, 30]
const DEFAULT_LIVE_WINDOW_MINUTES = 180
const LIVE_REFRESH_INTERVAL_MS = 60 * 1000
const TERMINAL_STATUSES = new Set(['FINISHED', 'AWARDED', 'CANCELLED', 'CANCELED', 'POSTPONED', 'SUSPENDED'])

type FixtureRow = {
  match_id: string
  kickoff_at: string
  status: string | null
  football_data_match_id: number | null
  match_details_last_checked_at: string | null
}

type DueFixture = FixtureRow & {
  reason: string
}

const fetchFootballData = async (endpoint: string, apiKey: string) => {
  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}${endpoint}`, {
    headers: {
      'X-Auth-Token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`football-data request failed: ${endpoint} (${response.status})`)
  }

  return response.json()
}

const asDate = (value: string | null) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getLiveWindowMinutes = () => {
  const configuredMinutes = Number(Deno.env.get('MATCH_DETAILS_LIVE_WINDOW_MINUTES') ?? DEFAULT_LIVE_WINDOW_MINUTES)
  return Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : DEFAULT_LIVE_WINDOW_MINUTES
}

const isTerminalStatus = (status: string | null) => Boolean(status && TERMINAL_STATUSES.has(status))

const getDueReason = (fixture: FixtureRow, now: Date, liveWindowMinutes: number) => {
  if (!fixture.football_data_match_id || isTerminalStatus(fixture.status)) {
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

  if (nowTime < kickoffTime) {
    const duePrematchRefresh = PREMATCH_REFRESH_MINUTES.some((minutesBeforeKickoff) => {
      const targetTime = kickoffTime - minutesBeforeKickoff * 60 * 1000
      return nowTime >= targetTime && lastCheckedTime < targetTime
    })

    return duePrematchRefresh ? 'prematch' : null
  }

  const liveWindowEndsAt = kickoffTime + liveWindowMinutes * 60 * 1000
  if (nowTime > liveWindowEndsAt) {
    return null
  }

  return nowTime - lastCheckedTime >= LIVE_REFRESH_INTERVAL_MS ? 'live' : null
}

const toFixtureDetailUpdate = (match: Record<string, any>, syncedAt: string) => ({
  kickoff_at: match.utcDate,
  home_team: match.homeTeam?.name ?? 'TBD',
  away_team: match.awayTeam?.name ?? 'TBD',
  ground: match.venue ?? null,
  football_data_match_id: match.id,
  home_football_data_team_id: match.homeTeam?.id ?? null,
  away_football_data_team_id: match.awayTeam?.id ?? null,
  status: match.status ?? null,
  minute: match.minute ?? null,
  home_score: match.score?.fullTime?.home ?? null,
  away_score: match.score?.fullTime?.away ?? null,
  score_winner: match.score?.winner ?? null,
  score_detail: match.score ?? {},
  home_formation: match.homeTeam?.formation ?? null,
  away_formation: match.awayTeam?.formation ?? null,
  home_lineup: match.homeTeam?.lineup ?? [],
  away_lineup: match.awayTeam?.lineup ?? [],
  home_bench: match.homeTeam?.bench ?? [],
  away_bench: match.awayTeam?.bench ?? [],
  home_statistics: match.homeTeam?.statistics ?? {},
  away_statistics: match.awayTeam?.statistics ?? {},
  goals: match.goals ?? [],
  bookings: match.bookings ?? [],
  substitutions: match.substitutions ?? [],
  penalties: match.penalties ?? [],
  raw_payload: match,
  match_details_raw_payload: match,
  match_details_last_updated_at: match.lastUpdated ?? null,
  match_details_last_checked_at: syncedAt,
  match_details_synced_at: syncedAt,
  updated_at: syncedAt,
})

Deno.serve(async () => {
  const syncedAt = new Date().toISOString()

  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const apiKey = requireEnv('FOOTBALL_DATA_API_KEY')
    const now = new Date(syncedAt)
    const liveWindowMinutes = getLiveWindowMinutes()
    const lowerBound = new Date(now.getTime() - liveWindowMinutes * 60 * 1000).toISOString()
    const upperBound = new Date(now.getTime() + 56 * 60 * 1000).toISOString()

    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select('match_id,kickoff_at,status,football_data_match_id,match_details_last_checked_at')
      .not('football_data_match_id', 'is', null)
      .gte('kickoff_at', lowerBound)
      .lte('kickoff_at', upperBound)
      .order('kickoff_at', { ascending: true })

    if (error) {
      throw error
    }

    const dueFixtures = ((fixtures ?? []) as FixtureRow[]).reduce<DueFixture[]>((records, fixture) => {
      const reason = getDueReason(fixture, now, liveWindowMinutes)
      return reason ? [...records, { ...fixture, reason }] : records
    }, [])

    const results = []

    for (const fixture of dueFixtures) {
      try {
        const endpoint = `/matches/${fixture.football_data_match_id}`
        const match = await fetchFootballData(endpoint, apiKey)
        const { error: updateError } = await supabase
          .from('fixtures')
          .update(toFixtureDetailUpdate(match, syncedAt))
          .eq('match_id', fixture.match_id)

        if (updateError) {
          throw updateError
        }

        results.push({
          matchId: fixture.match_id,
          footballDataMatchId: fixture.football_data_match_id,
          reason: fixture.reason,
          ok: true,
        })
      } catch (error) {
        results.push({
          matchId: fixture.match_id,
          footballDataMatchId: fixture.football_data_match_id,
          reason: fixture.reason,
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return jsonResponse({
      ok: results.every((result) => result.ok),
      checkedAt: syncedAt,
      candidateCount: fixtures?.length ?? 0,
      dueCount: dueFixtures.length,
      results,
    })
  } catch (error) {
    return jsonResponse({ ok: false, checkedAt: syncedAt, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
