import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'
import { getMatchDetailsDueReason } from '../_shared/matchDetailsSchedule.ts'
import type { FixtureRow } from '../_shared/matchDetailsSchedule.ts'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_LIVE_WINDOW_MINUTES = 180
const DEFAULT_INTERRUPTED_MATCH_RECOVERY_WINDOW_MINUTES = 48 * 60
const DEFAULT_TERMINAL_SCORE_WINDOW_MINUTES = 24 * 60

type DueFixture = FixtureRow & {
  reason: string
}

const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error)
  }

  return String(error)
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

const invokeSyncStandings = async (supabaseUrl: string, serviceRoleKey: string) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/sync-standings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.ok === false) {
    throw new Error(`sync-standings invoke failed: ${response.status} ${JSON.stringify(payload)}`)
  }

  return payload
}

const getLiveWindowMinutes = () => {
  const configuredMinutes = Number(Deno.env.get('MATCH_DETAILS_LIVE_WINDOW_MINUTES') ?? DEFAULT_LIVE_WINDOW_MINUTES)
  return Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : DEFAULT_LIVE_WINDOW_MINUTES
}

const getTerminalScoreWindowMinutes = () => {
  const configuredMinutes = Number(Deno.env.get('MATCH_DETAILS_TERMINAL_SCORE_WINDOW_MINUTES') ?? DEFAULT_TERMINAL_SCORE_WINDOW_MINUTES)
  return Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : DEFAULT_TERMINAL_SCORE_WINDOW_MINUTES
}

const getInterruptedMatchRecoveryWindowMinutes = () => {
  const configuredMinutes = Number(
    Deno.env.get('MATCH_DETAILS_INTERRUPTED_RECOVERY_WINDOW_MINUTES') ?? DEFAULT_INTERRUPTED_MATCH_RECOVERY_WINDOW_MINUTES,
  )
  return Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_INTERRUPTED_MATCH_RECOVERY_WINDOW_MINUTES
}

const toFixtureDetailUpdate = (match: Record<string, any>, syncedAt: string) => {
  const update: Record<string, any> = {
    kickoff_at: match.utcDate,
    home_team: match.homeTeam?.name ?? 'TBD',
    away_team: match.awayTeam?.name ?? 'TBD',
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
  }

  if (typeof match.venue === 'string' && match.venue.trim() !== '') {
    update.ground = match.venue.trim()
  }

  return update
}

Deno.serve(async () => {
  const syncedAt = new Date().toISOString()

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL')
    const serviceRoleKey = firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const apiKey = requireEnv('FOOTBALL_DATA_API_KEY')
    const now = new Date(syncedAt)
    const liveWindowMinutes = getLiveWindowMinutes()
    const interruptedMatchRecoveryWindowMinutes = getInterruptedMatchRecoveryWindowMinutes()
    const terminalScoreWindowMinutes = getTerminalScoreWindowMinutes()
    const lowerBoundMinutes = Math.max(liveWindowMinutes, interruptedMatchRecoveryWindowMinutes, terminalScoreWindowMinutes)
    const lowerBound = new Date(now.getTime() - lowerBoundMinutes * 60 * 1000).toISOString()
    const upperBound = new Date(now.getTime() + 56 * 60 * 1000).toISOString()

    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select('match_id,kickoff_at,status,football_data_match_id,match_details_last_checked_at,home_lineup,away_lineup,home_score,away_score,score_winner,score_detail')
      .not('football_data_match_id', 'is', null)
      .gte('kickoff_at', lowerBound)
      .lte('kickoff_at', upperBound)
      .order('kickoff_at', { ascending: true })

    if (error) {
      throw error
    }

    const dueFixtures = ((fixtures ?? []) as FixtureRow[]).reduce<DueFixture[]>((records, fixture) => {
      const reason = getMatchDetailsDueReason(fixture, now, {
        liveWindowMinutes,
        interruptedMatchRecoveryWindowMinutes,
        terminalScoreWindowMinutes,
      })
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

        const shouldSyncStandings = fixture.status !== 'FINISHED' && match.status === 'FINISHED'
        let standingsSync = null

        if (shouldSyncStandings) {
          try {
            standingsSync = await invokeSyncStandings(supabaseUrl, serviceRoleKey)
          } catch (standingsError) {
            standingsSync = {
              ok: false,
              error: errorMessage(standingsError),
            }
          }
        }

        results.push({
          matchId: fixture.match_id,
          footballDataMatchId: fixture.football_data_match_id,
          reason: fixture.reason,
          ok: true,
          standingsInvoked: shouldSyncStandings,
          standingsSync,
        })
      } catch (error) {
        results.push({
          matchId: fixture.match_id,
          footballDataMatchId: fixture.football_data_match_id,
          reason: fixture.reason,
          ok: false,
          error: errorMessage(error),
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
    return jsonResponse({ ok: false, checkedAt: syncedAt, error: errorMessage(error) }, 500)
  }
})
