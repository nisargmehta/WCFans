import teams from '../data/worldcupTeams2026.json'
import worldCupSchedule from '../data/worldcup2026.json'
import { formatKickoffTime } from './timeFormat'

const teamMetaByName = new Map(
  teams.flatMap((team) => [
    [normalizeTeamName(team.name), team],
    team.name_normalised ? [normalizeTeamName(team.name_normalised), team] : null,
    team.fifa_code ? [normalizeTeamName(team.fifa_code), team] : null,
  ]).filter(Boolean),
)

const fallbackGroundByTeams = new Map(
  (worldCupSchedule.matches ?? []).map((match) => [
    getFixtureTeamsKey(match.team1, match.team2),
    match.ground,
  ]),
)

const getTeam = (name) => {
  const team = teamMetaByName.get(normalizeTeamName(name))

  return {
    name,
    code: team?.fifa_code ?? name.slice(0, 3).toUpperCase(),
    flag: team?.flag_icon ?? '',
  }
}

const toMatchStatus = (status) => {
  if (status === 'IN_PLAY' || status === 'PAUSED') {
    return 'Live'
  }

  if (status === 'FINISHED') {
    return 'Final'
  }

  return 'Scheduled'
}

export const mapFixtureRowsToMatches = (fixtures) =>
  fixtures.map((fixture) => {
    const kickoff = new Date(fixture.kickoff_at)

    return {
      id: fixture.match_id,
      round: fixture.round_name ?? 'World Cup',
      date: kickoff.toISOString().slice(0, 10),
      time: formatKickoffTime(fixture.kickoff_at),
      kickoffAt: kickoff.toISOString(),
      group: fixture.group_name ?? fixture.round_name ?? 'World Cup',
      ground: getFixtureGround(fixture),
      minute: fixture.minute,
      status: toMatchStatus(fixture.status),
      home: getTeam(fixture.home_team),
      away: getTeam(fixture.away_team),
      score: { home: fixture.home_score, away: fixture.away_score },
      details: {
        syncedAt: fixture.match_details_synced_at,
        homeFormation: fixture.home_formation,
        awayFormation: fixture.away_formation,
        homeLineup: fixture.home_lineup ?? [],
        awayLineup: fixture.away_lineup ?? [],
        homeBench: fixture.home_bench ?? [],
        awayBench: fixture.away_bench ?? [],
        homeStatistics: fixture.home_statistics ?? {},
        awayStatistics: fixture.away_statistics ?? {},
        goals: fixture.goals ?? [],
        bookings: fixture.bookings ?? [],
        substitutions: fixture.substitutions ?? [],
        penalties: fixture.penalties ?? [],
        score: fixture.score_detail ?? {},
        referees: fixture.raw_payload?.referees ?? [],
      },
      events: [],
    }
  })

const getFixtureGround = (fixture) => {
  if (typeof fixture.ground === 'string' && fixture.ground.trim() !== '') {
    return fixture.ground.trim()
  }

  return fallbackGroundByTeams.get(getFixtureTeamsKey(fixture.home_team, fixture.away_team)) ?? 'Venue TBA'
}

function getFixtureTeamsKey(homeTeam, awayTeam) {
  return `${getCanonicalTeamKey(homeTeam)}::${getCanonicalTeamKey(awayTeam)}`
}

function getCanonicalTeamKey(name) {
  const normalizedName = normalizeTeamName(name)
  const team = teamMetaByName.get(normalizedName)

  return normalizeTeamName(team?.name ?? normalizedName)
}

function normalizeTeamName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/\band\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export const sortMatchesByKickoff = (matches) =>
  [...matches].sort((first, second) => {
    const firstTime = new Date(first.kickoffAt ?? `${first.date}T00:00:00Z`).getTime()
    const secondTime = new Date(second.kickoffAt ?? `${second.date}T00:00:00Z`).getTime()

    if (firstTime !== secondTime) {
      return firstTime - secondTime
    }

    return first.id.localeCompare(second.id)
  })
