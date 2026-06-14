const GENERIC_EXCUSES = [
  'The ref was biased and everyone watching knows it.',
  'The weather ruined the rhythm before the match could breathe.',
  'The pitch was playing like a different sport.',
  'Tournament nerves got the better of a team that is usually much sharper.',
  'The schedule gave them no recovery time.',
  'The travel caught up with them in the second half.',
  'One lucky bounce changed the whole match.',
  'VAR somehow found every angle except the useful one.',
  'The opponent treated it like a final while our team was saving legs for the bigger picture.',
  'The keeper had the game of his life against us.',
  'The match plan was right, the finishing just needed one clean touch.',
  'That result happens once in a hundred simulations.',
  'The scoreline is doing a lot of lying here.',
  'The better football was obvious, even if the scoreboard panicked.',
  'A team can lose the match and still win the argument.',
  'The ball just refused to drop for us in the box.',
  'Their first goal changed the emotional temperature of the whole game.',
  'We were one clean final pass away all night.',
  'The match was decided by moments, not by football.',
  'The tournament script clearly needed a villain today.',
  'Every 50-50 decision somehow became 49-51.',
  'The tempo suited them because the ref let the game get choppy.',
  'Our legs looked heavy because the travel plan was brutal.',
  'The football gods demanded drama and we paid the bill.',
  'They defended like they were protecting a national treasure.',
  'One defensive lapse should not erase the rest of the performance.',
  'We were punished for trying to actually play through midfield.',
  'Their bench had fresher legs at the exact wrong time.',
  'The scoreboard is temporary. The eye test is forever.',
]

const LOW_OPPONENT_POSSESSION = 42
const DOMINANT_TEAM_POSSESSION = 55
const HIGH_CORNERS = 6
const CORNER_GAP = 3
const SHOT_GAP = 4
const FOUL_GAP = 4
const HIGH_SAVES = 5
export const WCFANS_URL = 'https://wc-fans.vercel.app'

export function getLosingSide(match) {
  if (match?.status !== 'Final') {
    return null
  }

  const homeScore = toNumber(match.score?.home)
  const awayScore = toNumber(match.score?.away)

  if (homeScore === null || awayScore === null || homeScore === awayScore) {
    return null
  }

  return homeScore < awayScore ? 'home' : 'away'
}

export function buildExcuseOptions(match, teamSide) {
  const team = match?.[teamSide]
  const opponentSide = teamSide === 'home' ? 'away' : 'home'
  const opponent = match?.[opponentSide]
  const details = match?.details ?? {}
  const teamStats = details[`${teamSide}Statistics`] ?? {}
  const opponentStats = details[`${opponentSide}Statistics`] ?? {}
  const statExcuses = [
    getPossessionExcuse(team, opponent, teamStats, opponentStats),
    getCornerExcuse(opponent, teamStats, opponentStats),
    getShotExcuse(team, opponent, teamStats, opponentStats),
    getKeeperExcuse(opponent, opponentStats),
    getFoulExcuse(opponent, teamStats, opponentStats),
    getRedCardExcuse(teamStats),
  ].filter(Boolean)

  return [...statExcuses, ...GENERIC_EXCUSES]
}

export function buildExcuseShareText(match, teamSide, excuse) {
  const team = match?.[teamSide]
  const opponent = match?.[teamSide === 'home' ? 'away' : 'home']
  const hashtag = buildMatchupHashtag(team, opponent)

  return `${excuse} #${hashtag}. ${WCFANS_URL}`
}

export function buildMatchupHashtag(team, opponent) {
  const teamLabel = getHashtagTeamLabel(team)
  const opponentLabel = getHashtagTeamLabel(opponent)

  return `${teamLabel}Vs${opponentLabel}`
}

function getPossessionExcuse(team, opponent, teamStats, opponentStats) {
  const teamPossession = toNumber(teamStats.ball_possession)
  const opponentPossession = toNumber(opponentStats.ball_possession)

  if (
    teamPossession !== null &&
    opponentPossession !== null &&
    teamPossession >= DOMINANT_TEAM_POSSESSION &&
    opponentPossession <= LOW_OPPONENT_POSSESSION
  ) {
    return `Only one team was playing football. ${team?.name ?? 'Our team'} had the ball, ${opponent?.name ?? 'they'} had the result.`
  }

  return null
}

function getCornerExcuse(opponent, teamStats, opponentStats) {
  const teamCorners = toNumber(teamStats.corner_kicks)
  const opponentCorners = toNumber(opponentStats.corner_kicks)

  if (
    opponentCorners !== null &&
    opponentCorners >= HIGH_CORNERS &&
    (teamCorners === null || opponentCorners >= teamCorners + CORNER_GAP)
  ) {
    return `${opponent?.name ?? 'They'} relied too much on set pieces. Take away the corners and what was left?`
  }

  return null
}

function getShotExcuse(team, opponent, teamStats, opponentStats) {
  const teamShots = toNumber(teamStats.shots)
  const opponentShots = toNumber(opponentStats.shots)

  if (teamShots !== null && opponentShots !== null && teamShots >= opponentShots + SHOT_GAP) {
    return `${team?.name ?? 'Our team'} created the volume. ${opponent?.name ?? 'They'} just got the lucky finish.`
  }

  return null
}

function getKeeperExcuse(opponent, opponentStats) {
  const opponentSaves = toNumber(opponentStats.saves)

  if (opponentSaves !== null && opponentSaves >= HIGH_SAVES) {
    return `${opponent?.name ?? 'Their'} keeper turned into a wall for one night. That is not repeatable.`
  }

  return null
}

function getFoulExcuse(opponent, teamStats, opponentStats) {
  const teamFouls = toNumber(teamStats.fouls)
  const opponentFouls = toNumber(opponentStats.fouls)

  if (teamFouls !== null && opponentFouls !== null && opponentFouls >= teamFouls + FOUL_GAP) {
    return `${opponent?.name ?? 'They'} kept breaking up the rhythm with fouls. Hard to play football through that.`
  }

  return null
}

function getRedCardExcuse(teamStats) {
  const redCards = toNumber(teamStats.red_cards)

  if (redCards !== null && redCards > 0) {
    return 'The red card changed the whole match. Eleven against eleven tells a different story.'
  }

  return null
}

function toNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

function getHashtagTeamLabel(team) {
  const rawLabel = team?.code || team?.name || 'Team'
  const compactLabel = String(rawLabel).replace(/[^a-z0-9]/gi, '')

  if (!compactLabel) {
    return 'Team'
  }

  if (compactLabel === compactLabel.toUpperCase() && compactLabel.length <= 3) {
    return compactLabel === 'USA' ? 'USA' : `${compactLabel[0]}${compactLabel.slice(1).toLowerCase()}`
  }

  return `${compactLabel[0].toUpperCase()}${compactLabel.slice(1)}`
}
