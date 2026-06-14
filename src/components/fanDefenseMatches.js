import { getLosingSide } from './excuseGenerator'

export function getRecentFanDefenseMatches(matches, limit = 4) {
  return [...(matches ?? [])]
    .map((match) => {
      const losingSide = getLosingSide(match)

      if (!losingSide) {
        return null
      }

      const opponentSide = losingSide === 'home' ? 'away' : 'home'

      return {
        ...match,
        losingSide,
        losingTeam: match[losingSide],
        opponent: match[opponentSide],
      }
    })
    .filter(Boolean)
    .sort((first, second) => getMatchTimestamp(second) - getMatchTimestamp(first))
    .slice(0, limit)
}

function getMatchTimestamp(match) {
  const timestamp = new Date(match.kickoffAt ?? `${match.date}T12:00:00Z`).getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}
