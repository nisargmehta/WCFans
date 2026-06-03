import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'
const DEFAULT_LEAGUE_ID = '1'
const DEFAULT_SEASON = '2026'

type StandingRow = {
  league_id: number
  season: number
  team_id: number
  team_name: string
  team_logo: string | null
  group_name: string | null
  rank: number | null
  points: number | null
  goals_diff: number | null
  form: string | null
  status: string | null
  description: string | null
  all_played: number | null
  all_win: number | null
  all_draw: number | null
  all_lose: number | null
  goals_for: number | null
  goals_against: number | null
  raw_payload: Record<string, unknown>
  fetched_at: string
  updated_at: string
}

type HaircutTrackerRow = {
  league_id: number
  season: number
  team_id: number
  team_name: string
  team_logo: string | null
  group_name: string | null
  form: string | null
  wins_in_a_row: number
  can_cut_hair: boolean
  fetched_at: string
  updated_at: string
}

const fetchApiFootball = async (endpoint: string, apiKey: string) => {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${endpoint}`)
  }

  return response.json()
}

const asNumber = (value: unknown) => (typeof value === 'number' ? value : null)

const asString = (value: unknown) => (typeof value === 'string' ? value : null)

const getCurrentWinStreak = (form: string | null) => {
  if (!form) {
    return 0
  }

  const results = form.toUpperCase().replace(/[^WDL]/g, '').split('')
  let streak = 0

  for (let index = results.length - 1; index >= 0; index -= 1) {
    if (results[index] !== 'W') {
      break
    }

    streak += 1
  }

  return streak
}

const toStandingRows = (data: Record<string, any>, leagueId: number, season: number, fetchedAt: string): StandingRow[] => {
  const standings = data.response?.[0]?.league?.standings ?? []

  return standings.flatMap((group: Array<Record<string, any>>) =>
    group.map((standing) => ({
      league_id: leagueId,
      season,
      team_id: standing.team?.id,
      team_name: standing.team?.name,
      team_logo: standing.team?.logo ?? null,
      group_name: standing.group ?? null,
      rank: asNumber(standing.rank),
      points: asNumber(standing.points),
      goals_diff: asNumber(standing.goalsDiff),
      form: asString(standing.form),
      status: asString(standing.status),
      description: asString(standing.description),
      all_played: asNumber(standing.all?.played),
      all_win: asNumber(standing.all?.win),
      all_draw: asNumber(standing.all?.draw),
      all_lose: asNumber(standing.all?.lose),
      goals_for: asNumber(standing.all?.goals?.for),
      goals_against: asNumber(standing.all?.goals?.against),
      raw_payload: standing,
      fetched_at: fetchedAt,
      updated_at: fetchedAt,
    })),
  )
}

const toHaircutTrackerRows = (standings: StandingRow[], fetchedAt: string): HaircutTrackerRow[] =>
  standings.map((standing) => {
    const winsInARow = getCurrentWinStreak(standing.form)

    return {
      league_id: standing.league_id,
      season: standing.season,
      team_id: standing.team_id,
      team_name: standing.team_name,
      team_logo: standing.team_logo,
      group_name: standing.group_name,
      form: standing.form,
      wins_in_a_row: winsInARow,
      can_cut_hair: winsInARow >= 5,
      fetched_at: fetchedAt,
      updated_at: fetchedAt,
    }
  })

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const apiKey = requireEnv('API_FOOTBALL_KEY')
    const leagueId = Number(Deno.env.get('API_FOOTBALL_LEAGUE_ID') ?? DEFAULT_LEAGUE_ID)
    const season = Number(Deno.env.get('API_FOOTBALL_SEASON') ?? DEFAULT_SEASON)
    const endpoint = `/standings?league=${leagueId}&season=${season}`
    const fetchedAt = new Date().toISOString()
    const data = await fetchApiFootball(endpoint, apiKey)
    const rows = toStandingRows(data, leagueId, season, fetchedAt).filter((row) => row.team_id && row.team_name)

    if (rows.length > 0) {
      const { error } = await supabase.from('standings').upsert(rows, { onConflict: 'league_id,season,team_id' })

      if (error) {
        throw error
      }

      const trackerRows = toHaircutTrackerRows(rows, fetchedAt)
      const { error: trackerError } = await supabase
        .from('haircut_tracker')
        .upsert(trackerRows, { onConflict: 'league_id,season,team_id' })

      if (trackerError) {
        throw trackerError
      }
    }

    return jsonResponse({ ok: true, count: rows.length, leagueId, season })
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
