import teams from '../data/worldcupTeams2026.json'

const teamMetaByName = new Map(teams.map((team) => [team.name.toLowerCase(), team]))

const getTeam = (name) => {
  const team = teamMetaByName.get(name.toLowerCase())

  return {
    name,
    code: team?.fifa_code ?? name.slice(0, 3).toUpperCase(),
    flag: team?.flag_icon ?? '',
  }
}

const formatTime = (kickoffAt) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(kickoffAt))

export const mapFixtureRowsToMatches = (fixtures) =>
  fixtures.map((fixture) => {
    const kickoff = new Date(fixture.kickoff_at)

    return {
      id: fixture.match_id,
      round: fixture.round_name ?? 'World Cup',
      date: kickoff.toISOString().slice(0, 10),
      time: formatTime(fixture.kickoff_at),
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
