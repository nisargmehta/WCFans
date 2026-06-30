const PROVIDER_WINNER_SIDES = {
  HOME_TEAM: 'home',
  AWAY_TEAM: 'away',
  HOME: 'home',
  AWAY: 'away',
}

export function getWinnerSide(match) {
  const providerWinner = match?.winner ?? match?.score?.winner ?? match?.details?.score?.winner
  const providerSide = getProviderWinnerSide(providerWinner)

  if (providerSide) {
    return providerSide
  }

  const homeScore = toNumber(match?.score?.home)
  const awayScore = toNumber(match?.score?.away)

  if (homeScore !== null && awayScore !== null && homeScore === awayScore) {
    const penaltyScore = getPenaltyShootoutScore(match)

    if (penaltyScore && penaltyScore.home !== penaltyScore.away) {
      return penaltyScore.home > penaltyScore.away ? 'home' : 'away'
    }
  }

  if (homeScore === null || awayScore === null || homeScore === awayScore) {
    return null
  }

  return homeScore > awayScore ? 'home' : 'away'
}

export function isPenaltyShootoutResult(match) {
  if (match?.status !== 'Final') {
    return false
  }

  const scoreDuration = match?.score?.duration ?? match?.details?.score?.duration
  if (typeof scoreDuration === 'string' && scoreDuration.toUpperCase().includes('PENAL')) {
    return true
  }

  if (getPenaltyShootoutScore(match)) {
    return true
  }

  const homeScore = toNumber(match?.score?.home)
  const awayScore = toNumber(match?.score?.away)

  return homeScore !== null && awayScore !== null && homeScore === awayScore && Boolean(getWinnerSide(match))
}

export function getResultSummary(match) {
  if (!isPenaltyShootoutResult(match)) {
    return null
  }

  const winnerSide = getWinnerSide(match)
  if (!winnerSide) {
    return null
  }

  const winner = match?.[winnerSide]
  const winnerLabel = winner?.code ?? winner?.name ?? 'Winner'
  const shootoutScore = getPenaltyShootoutScore(match)

  if (shootoutScore && shootoutScore.home !== shootoutScore.away) {
    const loserSide = winnerSide === 'home' ? 'away' : 'home'

    return `${winnerLabel} wins ${shootoutScore[winnerSide]}-${shootoutScore[loserSide]} on pens`
  }

  return `${winnerLabel} wins on pens`
}

export function hasCompleteFinalResult(match) {
  if (match?.status !== 'Final') {
    return false
  }

  const homeScore = toNumber(match?.score?.home)
  const awayScore = toNumber(match?.score?.away)

  if (homeScore === null || awayScore === null) {
    return false
  }

  if (homeScore !== awayScore || getWinnerSide(match)) {
    return true
  }

  const duration = getScoreDuration(match)
  if (!duration) {
    return false
  }

  return duration === 'REGULAR'
}

export function getPenaltyShootoutScore(match) {
  const directScore = [
    match?.penaltyScore,
    match?.score?.penalties,
    match?.score?.penalty,
    match?.score?.penaltyShootout,
    match?.score?.shootout,
    match?.details?.score?.penalties,
    match?.details?.score?.penalty,
    match?.details?.score?.penaltyShootout,
    match?.details?.score?.shootout,
  ].map(toScorePair).find(Boolean)

  if (directScore) {
    return directScore
  }

  return countPenaltyEvents(match)
}

function getScoreDuration(match) {
  const duration = match?.score?.duration ?? match?.details?.score?.duration

  return typeof duration === 'string' ? duration.toUpperCase() : null
}

function countPenaltyEvents(match) {
  const penalties = match?.details?.penalties
  if (!Array.isArray(penalties) || penalties.length === 0) {
    return null
  }

  const score = penalties.reduce(
    (totals, penalty) => {
      if (!penalty?.scored) {
        return totals
      }

      const side = getTeamSide(penalty.team?.name, match)
      if (side) {
        totals[side] += 1
      }

      return totals
    },
    { home: 0, away: 0 },
  )

  return score.home > 0 || score.away > 0 ? score : null
}

function getProviderWinnerSide(winner) {
  if (typeof winner !== 'string') {
    return null
  }

  return PROVIDER_WINNER_SIDES[winner.toUpperCase()] ?? null
}

function toScorePair(score) {
  const home = toNumber(score?.home)
  const away = toNumber(score?.away)

  if (home === null || away === null) {
    return null
  }

  return { home, away }
}

function getTeamSide(teamName, match) {
  const normalizedTeamName = normalizeTeamName(teamName)

  if (!normalizedTeamName) {
    return null
  }

  if (normalizedTeamName === normalizeTeamName(match?.home?.name)) {
    return 'home'
  }

  if (normalizedTeamName === normalizeTeamName(match?.away?.name)) {
    return 'away'
  }

  return null
}

function normalizeTeamName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function toNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
