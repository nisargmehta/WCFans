import schedule from '../data/worldcup2026.json'
import teams from '../data/worldcupTeams2026.json'

const teamMetaByName = new Map(teams.map((team) => [team.name, team]))

const liveIndexes = [0, 1, 4, 9]

const getKickoffAt = ({ date, time }) => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d+)?$/)

  if (!match) {
    return `${date}T00:00:00Z`
  }

  const [, hour, minute, offset = '+0'] = match
  const utcHour = Number(hour) - Number(offset)
  return new Date(Date.UTC(...date.split('-').map(Number).map((value, index) => (index === 1 ? value - 1 : value)), utcHour, Number(minute))).toISOString()
}

export const getMockMatches = () =>
  schedule.matches.map((match, index) => {
    const team1 = teamMetaByName.get(match.team1)
    const team2 = teamMetaByName.get(match.team2)
    const liveSeed = liveIndexes.indexOf(index)
    const isLive = liveSeed >= 0
    const homeScore = isLive ? (index + 1) % 3 : null
    const awayScore = isLive ? (index + 2) % 2 : null

    return {
      id: `${match.date}-${match.team1}-${match.team2}`.toLowerCase().replaceAll(' ', '-'),
      round: match.round,
      date: match.date,
      time: match.time,
      kickoffAt: getKickoffAt(match),
      group: match.group,
      ground: match.ground,
      minute: isLive ? 16 + liveSeed * 11 : null,
      status: isLive ? 'Live' : 'Scheduled',
      home: {
        name: match.team1,
        code: team1?.fifa_code ?? match.team1.slice(0, 3).toUpperCase(),
        flag: team1?.flag_icon ?? '',
      },
      away: {
        name: match.team2,
        code: team2?.fifa_code ?? match.team2.slice(0, 3).toUpperCase(),
        flag: team2?.flag_icon ?? '',
      },
      score: { home: homeScore, away: awayScore },
      events: [],
    }
  })
