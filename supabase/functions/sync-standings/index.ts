import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const DEFAULT_COMPETITION_CODE = 'WC'
const DEFAULT_COMPETITION_ID = '2000'
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

type TeamGroupMap = Map<number, string>

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

const asNumber = (value: unknown) => (typeof value === 'number' ? value : null)

const asString = (value: unknown) => (typeof value === 'string' ? value : null)

const normalizeForm = (form: string | null) => (form ? form.replace(/,/g, '') : null)

const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error)
  }

  return String(error)
}

const numberEnv = (name: string, defaultValue: string) => {
  const value = Number(Deno.env.get(name) ?? defaultValue)

  if (!Number.isFinite(value)) {
    return Number(defaultValue)
  }

  return value
}

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

const toGroupName = (group: unknown) => {
  if (typeof group !== 'string' || group.length === 0) {
    return null
  }

  return group.replace(/^GROUP_/, 'Group ').replace(/_/g, ' ')
}

const toTeamGroupMap = (data: Record<string, any>): TeamGroupMap => {
  const groups: TeamGroupMap = new Map()

  ;(data.matches ?? []).forEach((match: Record<string, any>) => {
    const groupName = toGroupName(match.group)

    if (!groupName) {
      return
    }

    if (typeof match.homeTeam?.id === 'number') {
      groups.set(match.homeTeam.id, groupName)
    }

    if (typeof match.awayTeam?.id === 'number') {
      groups.set(match.awayTeam.id, groupName)
    }
  })

  return groups
}

const toStandingRows = (
  data: Record<string, any>,
  leagueId: number,
  season: number,
  fetchedAt: string,
  teamGroupMap: TeamGroupMap,
): StandingRow[] => {
  const standings = (data.standings ?? []).filter((standingGroup: Record<string, any>) => standingGroup.type === 'TOTAL')

  return standings.flatMap((standingGroup: Record<string, any>) =>
    (standingGroup.table ?? []).map((standing: Record<string, any>) => ({
      league_id: leagueId,
      season,
      team_id: standing.team?.id,
      team_name: standing.team?.name,
      team_logo: standing.team?.crest ?? null,
      group_name: toGroupName(standingGroup.group) ?? teamGroupMap.get(standing.team?.id) ?? null,
      rank: asNumber(standing.position),
      points: asNumber(standing.points),
      goals_diff: asNumber(standing.goalDifference),
      form: normalizeForm(asString(standing.form)),
      status: asString(standingGroup.type),
      description: asString(standingGroup.stage),
      all_played: asNumber(standing.playedGames),
      all_win: asNumber(standing.won),
      all_draw: asNumber(standing.draw),
      all_lose: asNumber(standing.lost),
      goals_for: asNumber(standing.goalsFor),
      goals_against: asNumber(standing.goalsAgainst),
      raw_payload: {
        entry: standing,
        standing: {
          stage: standingGroup.stage,
          type: standingGroup.type,
          group: standingGroup.group,
        },
      },
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

const uniqueStandingRows = (rows: StandingRow[]) =>
  [...new Map(rows.map((row) => [`${row.league_id}:${row.season}:${row.team_id}`, row])).values()]

const rankWithinGroups = (rows: StandingRow[]) => {
  const groupedRows = new Map<string, StandingRow[]>()

  rows.forEach((row) => {
    const groupName = row.group_name ?? 'Overall'
    groupedRows.set(groupName, [...(groupedRows.get(groupName) ?? []), row])
  })

  return [...groupedRows.values()].flatMap((groupRows) =>
    groupRows
      .sort((first, second) => {
        if ((first.points ?? 0) !== (second.points ?? 0)) {
          return (second.points ?? 0) - (first.points ?? 0)
        }

        if ((first.goals_diff ?? 0) !== (second.goals_diff ?? 0)) {
          return (second.goals_diff ?? 0) - (first.goals_diff ?? 0)
        }

        if ((first.goals_for ?? 0) !== (second.goals_for ?? 0)) {
          return (second.goals_for ?? 0) - (first.goals_for ?? 0)
        }

        return (first.rank ?? 999) - (second.rank ?? 999)
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      })),
  )
}

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const apiKey = requireEnv('FOOTBALL_DATA_API_KEY')
    const competitionCode = Deno.env.get('FOOTBALL_DATA_COMPETITION_CODE') ?? DEFAULT_COMPETITION_CODE
    const leagueId = numberEnv('FOOTBALL_DATA_COMPETITION_ID', DEFAULT_COMPETITION_ID)
    const season = numberEnv('FOOTBALL_DATA_SEASON', DEFAULT_SEASON)
    const endpoint = `/competitions/${competitionCode}/standings?season=${season}`
    const matchesEndpoint = `/competitions/${competitionCode}/matches?season=${season}`
    const fetchedAt = new Date().toISOString()
    const data = await fetchFootballData(endpoint, apiKey)
    const matchesData = await fetchFootballData(matchesEndpoint, apiKey)
    const teamGroupMap = toTeamGroupMap(matchesData)
    const rows = rankWithinGroups(
      uniqueStandingRows(
        toStandingRows(data, leagueId, season, fetchedAt, teamGroupMap).filter((row) => row.team_id && row.team_name),
      ),
    )

    if (rows.length > 0) {
      const { error } = await supabase.from('standings').upsert(rows, { onConflict: 'league_id,season,team_id' })

      if (error) {
        throw new Error(`standings upsert failed: ${errorMessage(error)}`)
      }

      const { error: trackerDeleteError } = await supabase
        .from('haircut_tracker')
        .delete()
        .eq('league_id', leagueId)
        .eq('season', season)

      if (trackerDeleteError) {
        throw new Error(`haircut tracker cleanup failed: ${errorMessage(trackerDeleteError)}`)
      }

      const trackerRows = toHaircutTrackerRows(rows.filter((row) => (row.all_played ?? 0) > 0), fetchedAt)

      if (trackerRows.length > 0) {
        const { error: trackerError } = await supabase
          .from('haircut_tracker')
          .upsert(trackerRows, { onConflict: 'league_id,season,team_id' })

        if (trackerError) {
          throw new Error(`haircut tracker upsert failed: ${errorMessage(trackerError)}`)
        }
      }
    }

    return jsonResponse({
      ok: true,
      count: rows.length,
      trackerCount: rows.filter((row) => (row.all_played ?? 0) > 0).length,
      competitionCode,
      leagueId,
      season,
    })
  } catch (error) {
    return jsonResponse({ ok: false, error: errorMessage(error) }, 500)
  }
})
