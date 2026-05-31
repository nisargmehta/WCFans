import schedule from '../data/worldcup2026.json'
import teams from '../data/worldcupTeams2026.json'

const teamMetaByName = new Map(teams.map((team) => [team.name, team]))

const eventTemplates = [
  ['Goal', '12 min', 'Fast break finished at the near post'],
  ['Yellow card', '31 min', 'Late challenge in midfield'],
  ['Goal', '58 min', 'Header from a corner'],
  ['Substitution', '72 min', 'Fresh legs on the right wing'],
]

const liveIndexes = [0, 1, 4, 9]

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
      events: isLive
        ? eventTemplates.slice(0, 2 + (index % 3)).map(([type, minute, detail], eventIndex) => ({
            id: `${index}-${eventIndex}`,
            type,
            minute,
            detail,
          }))
        : [],
    }
  })

export const getMockNews = () => [
  {
    id: 'draw-watch',
    headline: 'Opening week travel guide: three host nations, one huge kickoff',
    timestamp: '12 min ago',
    image:
      'https://images.unsplash.com/photo-1527871252447-4ce32da643c6?auto=format&fit=crop&w=900&q=80',
    category: 'Host Cities',
  },
  {
    id: 'tactical-board',
    headline: 'Group A preview: pressure, pace, and a very loud Azteca night',
    timestamp: '37 min ago',
    image:
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80',
    category: 'Analysis',
  },
  {
    id: 'fan-parks',
    headline: 'Fan parks prepare watch parties from Vancouver to Guadalajara',
    timestamp: '1 hr ago',
    image:
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80',
    category: 'Fans',
  },
  {
    id: 'young-stars',
    headline: 'Five breakout players supporters are already tracking',
    timestamp: '2 hrs ago',
    image:
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=900&q=80',
    category: 'Scouting',
  },
]

const streakSeeds = [4, 2, 5, 1, 3, 0, 4, 2, 5, 1, 3, 4]

export const getHaircutTracker = () =>
  teams.slice(0, 12).map((team, index) => ({
    id: team.fifa_code,
    team: team.name,
    code: team.fifa_code,
    flag: team.flag_icon,
    group: team.group,
    winsInARow: streakSeeds[index],
    canCutHair: streakSeeds[index] >= 5,
  }))
