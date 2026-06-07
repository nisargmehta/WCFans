import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_COMPETITION_CODE = 'WC'
const DEFAULT_SEASON = '2026'

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

const toGroupName = (group: unknown) => {
  if (typeof group !== 'string' || group.length === 0) {
    return null
  }

  return group.replace(/^GROUP_/, 'Group ').replace(/_/g, ' ')
}

const toRoundName = (match: Record<string, any>) => {
  if (match.matchday) {
    return `Matchday ${match.matchday}`
  }

  if (typeof match.stage === 'string') {
    return match.stage.replace(/_/g, ' ')
  }

  return null
}

const toFixtureRow = (item: Record<string, any>, fetchedAt: string) => ({
  match_id: `football-data-${item.id}`,
  kickoff_at: item.utcDate,
  home_team: item.homeTeam?.name ?? 'TBD',
  away_team: item.awayTeam?.name ?? 'TBD',
  group_name: toGroupName(item.group),
  round_name: toRoundName(item),
  ground: item.venue ?? null,
  api_football_fixture_id: item.id,
  football_data_match_id: item.id,
  home_api_football_team_id: item.homeTeam?.id ?? null,
  away_api_football_team_id: item.awayTeam?.id ?? null,
  home_football_data_team_id: item.homeTeam?.id ?? null,
  away_football_data_team_id: item.awayTeam?.id ?? null,
  status: item.status ?? null,
  minute: item.minute ?? null,
  home_score: item.score?.fullTime?.home ?? null,
  away_score: item.score?.fullTime?.away ?? null,
  score_winner: item.score?.winner ?? null,
  raw_payload: item,
  source: 'football-data',
  updated_at: fetchedAt,
})

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const apiKey = requireEnv('FOOTBALL_DATA_API_KEY')
    const competitionCode = Deno.env.get('FOOTBALL_DATA_COMPETITION_CODE') ?? DEFAULT_COMPETITION_CODE
    const season = Deno.env.get('FOOTBALL_DATA_SEASON') ?? DEFAULT_SEASON
    const endpoint = `/competitions/${competitionCode}/matches?season=${season}`
    const fetchedAt = new Date().toISOString()
    const data = await fetchFootballData(endpoint, apiKey)
    const rows = (data.matches ?? []).map((item: Record<string, any>) => toFixtureRow(item, fetchedAt))

    if (rows.length > 0) {
      const { error } = await supabase.from('fixtures').upsert(rows, { onConflict: 'match_id' })

      if (error) {
        throw error
      }
    }

    return jsonResponse({ ok: true, count: rows.length, competitionCode, season })
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
