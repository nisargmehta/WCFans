export const getCurrentWinStreak = (form: string | null) => {
  if (!form) {
    return 0
  }

  // football-data orders form from newest to oldest (for example, "W,D").
  const results = form.toUpperCase().match(/[WDL]/g) ?? []
  let streak = 0

  for (const result of results) {
    if (result !== 'W') {
      break
    }

    streak += 1
  }

  return streak
}

type FootballDataMatch = {
  utcDate?: string | null
  status?: string | null
  homeTeam?: {
    id?: number | null
  } | null
  awayTeam?: {
    id?: number | null
  } | null
  score?: {
    winner?: string | null
    fullTime?: {
      home?: number | null
      away?: number | null
    } | null
    penalties?: FootballDataScorePair | null
    penalty?: FootballDataScorePair | null
    penaltyShootout?: FootballDataScorePair | null
    shootout?: FootballDataScorePair | null
  } | null
}

type FootballDataScorePair = {
  home?: number | null
  away?: number | null
}

type TeamResult = {
  teamId: number
  result: 'W' | 'D' | 'L'
  playedAt: number
}

const toNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

const getPlayedAt = (utcDate: unknown) => {
  const playedAt = typeof utcDate === 'string' ? new Date(utcDate).getTime() : NaN

  return Number.isFinite(playedAt) ? playedAt : 0
}

const toScorePair = (score: FootballDataScorePair | null | undefined) => {
  const home = toNumber(score?.home)
  const away = toNumber(score?.away)

  return home !== null && away !== null ? { home, away } : null
}

const getPenaltyShootoutScore = (match: FootballDataMatch) =>
  [
    match.score?.penalties,
    match.score?.penalty,
    match.score?.penaltyShootout,
    match.score?.shootout,
  ].map(toScorePair).find(Boolean)

const getMatchResults = (match: FootballDataMatch): TeamResult[] => {
  if (match.status !== 'FINISHED') {
    return []
  }

  const homeTeamId = toNumber(match.homeTeam?.id)
  const awayTeamId = toNumber(match.awayTeam?.id)

  if (homeTeamId === null || awayTeamId === null) {
    return []
  }

  const winner = typeof match.score?.winner === 'string' ? match.score.winner.toUpperCase() : null
  const homeScore = toNumber(match.score?.fullTime?.home)
  const awayScore = toNumber(match.score?.fullTime?.away)
  const penaltyScore = getPenaltyShootoutScore(match)
  const playedAt = getPlayedAt(match.utcDate)

  if (winner === 'HOME_TEAM') {
    return [
      { teamId: homeTeamId, result: 'W', playedAt },
      { teamId: awayTeamId, result: 'L', playedAt },
    ]
  }

  if (winner === 'AWAY_TEAM') {
    return [
      { teamId: homeTeamId, result: 'L', playedAt },
      { teamId: awayTeamId, result: 'W', playedAt },
    ]
  }

  if (penaltyScore && penaltyScore.home !== penaltyScore.away) {
    return penaltyScore.home > penaltyScore.away
      ? [
        { teamId: homeTeamId, result: 'W', playedAt },
        { teamId: awayTeamId, result: 'L', playedAt },
      ]
      : [
        { teamId: homeTeamId, result: 'L', playedAt },
        { teamId: awayTeamId, result: 'W', playedAt },
      ]
  }

  if (winner === 'DRAW' || (homeScore !== null && awayScore !== null && homeScore === awayScore)) {
    return [
      { teamId: homeTeamId, result: 'D', playedAt },
      { teamId: awayTeamId, result: 'D', playedAt },
    ]
  }

  if (homeScore === null || awayScore === null) {
    return []
  }

  return homeScore > awayScore
    ? [
      { teamId: homeTeamId, result: 'W', playedAt },
      { teamId: awayTeamId, result: 'L', playedAt },
    ]
    : [
      { teamId: homeTeamId, result: 'L', playedAt },
      { teamId: awayTeamId, result: 'W', playedAt },
    ]
}

export const buildTeamResultForms = (matches: FootballDataMatch[]) => {
  const resultsByTeam = new Map<number, TeamResult[]>()

  matches.flatMap(getMatchResults).forEach((result) => {
    const teamResults = resultsByTeam.get(result.teamId) ?? []
    teamResults.push(result)
    resultsByTeam.set(result.teamId, teamResults)
  })

  return new Map(
    [...resultsByTeam.entries()].map(([teamId, results]) => [
      teamId,
      results
        .sort((first, second) => second.playedAt - first.playedAt)
        .map((result) => result.result)
        .join(''),
    ]),
  )
}
