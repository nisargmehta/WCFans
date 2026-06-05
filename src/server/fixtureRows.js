import teams from '../data/worldcupTeams2026.json'
import { formatKickoffTime } from './timeFormat'

const teamMetaByName = new Map(teams.map((team) => [team.name.toLowerCase(), team]))

const getTeam = (name) => {
  const team = teamMetaByName.get(name.toLowerCase())

  return {
    name,
    code: team?.fifa_code ?? name.slice(0, 3).toUpperCase(),
    flag: team?.flag_icon ?? '',
  }
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
      ground: fixture.ground ?? 'Venue TBA',
      minute: null,
      status: 'Scheduled',
      home: getTeam(fixture.home_team),
      away: getTeam(fixture.away_team),
      score: { home: null, away: null },
      events: [],
    }
  })

export const sortMatchesByKickoff = (matches) =>
  [...matches].sort((first, second) => {
    const firstTime = new Date(first.kickoffAt ?? `${first.date}T00:00:00Z`).getTime()
    const secondTime = new Date(second.kickoffAt ?? `${second.date}T00:00:00Z`).getTime()

    if (firstTime !== secondTime) {
      return firstTime - secondTime
    }

    return first.id.localeCompare(second.id)
  })
