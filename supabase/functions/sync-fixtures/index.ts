import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'
const DEFAULT_LEAGUE_ID = '1'
const DEFAULT_SEASON = '2026'

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

const toFixtureRow = (item: Record<string, any>, fetchedAt: string) => ({
  match_id: `api-football-${item.fixture.id}`,
  kickoff_at: item.fixture.date,
  home_team: item.teams?.home?.name ?? 'TBD',
  away_team: item.teams?.away?.name ?? 'TBD',
  group_name: item.league?.round ?? null,
  round_name: item.league?.round ?? null,
  ground: item.fixture?.venue?.name
    ? `${item.fixture.venue.name}${item.fixture.venue.city ? `, ${item.fixture.venue.city}` : ''}`
    : null,
  api_football_fixture_id: item.fixture.id,
  home_api_football_team_id: item.teams?.home?.id ?? null,
  away_api_football_team_id: item.teams?.away?.id ?? null,
  source: 'api-football',
  updated_at: fetchedAt,
})

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const apiKey = requireEnv('API_FOOTBALL_KEY')
    const leagueId = Deno.env.get('API_FOOTBALL_LEAGUE_ID') ?? DEFAULT_LEAGUE_ID
    const season = Deno.env.get('API_FOOTBALL_SEASON') ?? DEFAULT_SEASON
    const endpoint = `/fixtures?league=${leagueId}&season=${season}`
    const fetchedAt = new Date().toISOString()
    const data = await fetchApiFootball(endpoint, apiKey)
    const rows = (data.response ?? []).map((item: Record<string, any>) => toFixtureRow(item, fetchedAt))

    if (rows.length > 0) {
      const { error } = await supabase.from('fixtures').upsert(rows, { onConflict: 'match_id' })

      if (error) {
        throw error
      }
    }

    return jsonResponse({ ok: true, count: rows.length, leagueId, season })
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
