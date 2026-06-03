import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'
const PREVIEW_WINDOW_HOURS = 24
const DEFAULT_LEAGUE_ID = '1'
const DEFAULT_SEASON = '2026'

type FixtureRow = {
  match_id: string
  kickoff_at: string
  home_team: string
  away_team: string
  api_football_fixture_id: number | null
  home_api_football_team_id: number | null
  away_api_football_team_id: number | null
}

type Source = {
  label: string
  url: string
}

const apiSource = (endpoint: string): Source => ({
  label: 'API-Football',
  url: `${API_FOOTBALL_BASE_URL}${endpoint}`,
})

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

const summarizeHeadToHead = (fixtures: Array<Record<string, any>>, fixture: FixtureRow) => {
  const completedFixtures = fixtures.filter((item) =>
    ['FT', 'AET', 'PEN'].includes(item.fixture?.status?.short) &&
    typeof item.goals?.home === 'number' &&
    typeof item.goals?.away === 'number',
  )

  const totals = completedFixtures.reduce(
    (record, item) => {
      const homeName = item.teams?.home?.name
      const awayName = item.teams?.away?.name
      const homeGoals = item.goals.home
      const awayGoals = item.goals.away

      if (homeGoals === awayGoals) {
        record.draws += 1
      } else if (
        (homeName === fixture.home_team && homeGoals > awayGoals) ||
        (awayName === fixture.home_team && awayGoals > homeGoals)
      ) {
        record.homeWins += 1
      } else {
        record.awayWins += 1
      }

      return record
    },
    { homeWins: 0, awayWins: 0, draws: 0 },
  )

  if (completedFixtures.length === 0) {
    return `No completed head-to-head matches found for ${fixture.home_team} vs ${fixture.away_team}.`
  }

  return `${fixture.home_team} ${totals.homeWins} wins, ${fixture.away_team} ${totals.awayWins} wins, ${totals.draws} draws across ${completedFixtures.length} completed meetings.`
}

const getHeadToHead = async (fixture: FixtureRow, apiKey: string) => {
  if (!fixture.home_api_football_team_id || !fixture.away_api_football_team_id) {
    return {
      summary: 'Head-to-head needs API-Football team IDs before the preview job can refresh it.',
      sources: [],
    }
  }

  const endpoint = `/fixtures/headtohead?h2h=${fixture.home_api_football_team_id}-${fixture.away_api_football_team_id}`
  const data = await fetchApiFootball(endpoint, apiKey)

  return {
    summary: summarizeHeadToHead(data.response ?? [], fixture),
    sources: [apiSource(endpoint)],
  }
}

const getInjuries = async (fixture: FixtureRow, apiKey: string) => {
  if (!fixture.api_football_fixture_id) {
    return [
      {
        summary: 'Fixture-specific injury lookup needs an API-Football fixture ID.',
        sources: [],
      },
    ]
  }

  const endpoint = `/injuries?fixture=${fixture.api_football_fixture_id}`
  const data = await fetchApiFootball(endpoint, apiKey)
  const injuries = data.response ?? []

  if (injuries.length === 0) {
    return [
      {
        summary: 'No injuries reported by API-Football for this fixture.',
        sources: [apiSource(endpoint)],
      },
    ]
  }

  return injuries.slice(0, 4).map((injury: Record<string, any>) => ({
    summary: `${injury.team?.name ?? 'Team'}: ${injury.player?.name ?? 'Player'}${
      injury.player?.reason ? ` (${injury.player.reason})` : ''
    }${injury.player?.type ? ` - ${injury.player.type}` : ''}`,
    sources: [apiSource(endpoint)],
  }))
}

const getPlayersToWatch = async (fixture: FixtureRow, apiKey: string) => {
  const leagueId = Deno.env.get('API_FOOTBALL_LEAGUE_ID') ?? DEFAULT_LEAGUE_ID
  const season = Deno.env.get('API_FOOTBALL_SEASON') ?? DEFAULT_SEASON

  const endpoint = `/players/topscorers?league=${leagueId}&season=${season}`
  const data = await fetchApiFootball(endpoint, apiKey)
  const teamIds = new Set([fixture.home_api_football_team_id, fixture.away_api_football_team_id])
  const candidates = (data.response ?? []).filter((player: Record<string, any>) => {
    const teamId = player.statistics?.[0]?.team?.id
    return teamIds.has(teamId)
  })

  if (candidates.length === 0) {
    return [
      {
        summary: 'No top-scorer form data found for either team yet.',
        sources: [apiSource(endpoint)],
      },
    ]
  }

  return candidates.slice(0, 3).map((player: Record<string, any>) => {
    const stats = player.statistics?.[0]
    const goals = stats?.goals?.total ?? 0
    const assists = stats?.goals?.assists ?? 0

    return {
      summary: `${player.player?.name ?? 'Player'} (${stats?.team?.name ?? 'team'}): ${goals} goals, ${assists} assists.`,
      sources: [apiSource(endpoint)],
    }
  })
}

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const apiKey = requireEnv('API_FOOTBALL_KEY')
    const now = new Date()
    const upperBound = new Date(now.getTime() + PREVIEW_WINDOW_HOURS * 60 * 60 * 1000)

    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select(
        'match_id,kickoff_at,home_team,away_team,api_football_fixture_id,home_api_football_team_id,away_api_football_team_id',
      )
      .gte('kickoff_at', now.toISOString())
      .lte('kickoff_at', upperBound.toISOString())
      .order('kickoff_at', { ascending: true })

    if (error) {
      throw error
    }

    const previews = await Promise.all(
      ((fixtures ?? []) as FixtureRow[]).map(async (fixture) => {
        const [headToHead, injuries, playersToWatch] = await Promise.all([
          getHeadToHead(fixture, apiKey),
          getInjuries(fixture, apiKey),
          getPlayersToWatch(fixture, apiKey),
        ])

        return {
          match_id: fixture.match_id,
          generated_at: now.toISOString(),
          refresh_label: 'Prematch preview refreshed',
          head_to_head_summary: headToHead.summary,
          head_to_head_sources: headToHead.sources,
          players_to_watch: playersToWatch,
          injuries,
          raw_payload: {
            api_football_fixture_id: fixture.api_football_fixture_id,
            home_api_football_team_id: fixture.home_api_football_team_id,
            away_api_football_team_id: fixture.away_api_football_team_id,
          },
          updated_at: now.toISOString(),
        }
      }),
    )

    if (previews.length > 0) {
      const { error: upsertError } = await supabase.from('fixture_previews').upsert(previews, { onConflict: 'match_id' })

      if (upsertError) {
        throw upsertError
      }
    }

    return jsonResponse({ ok: true, count: previews.length })
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
