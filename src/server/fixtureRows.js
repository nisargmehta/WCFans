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

const fallbackFixtureByKickoffAndStage = new Map(
  (worldCupSchedule.matches ?? []).flatMap((match) => {
    const kickoffAt = getLocalScheduleKickoffAt(match)
    const stageKey = getStageKey(match.round)

    if (!kickoffAt || !stageKey) {
      return []
    }

    return [[getKickoffStageKey(kickoffAt, stageKey), match]]
  }),
)

const getTeam = (name) => {
  const team = teamMetaByName.get(normalizeTeamName(name))

  if (!team && isKnockoutSlotName(name)) {
    return {
      name,
      code: String(name).toUpperCase(),
      flag: '',
    }
  }

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
    const fallbackFixture = getFallbackFixture(fixture)
    const homeTeam = shouldUseFallbackTeam(fixture.home_team) ? fallbackFixture?.team1 ?? fixture.home_team : fixture.home_team
    const awayTeam = shouldUseFallbackTeam(fixture.away_team) ? fallbackFixture?.team2 ?? fixture.away_team : fixture.away_team

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
      home: getTeam(homeTeam),
      away: getTeam(awayTeam),
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

  const fallbackFixture = getFallbackFixture(fixture)

  if (typeof fallbackFixture?.ground === 'string' && fallbackFixture.ground.trim() !== '') {
    return fallbackFixture.ground.trim()
  }

  return fallbackGroundByTeams.get(getFixtureTeamsKey(fixture.home_team, fixture.away_team)) ?? 'Venue TBA'
}

function getFallbackFixture(fixture) {
  const kickoffAt = getIsoKickoffAt(fixture.kickoff_at)
  const stageKey = getStageKey(fixture.round_name ?? fixture.group_name)

  if (!kickoffAt || !stageKey) {
    return null
  }

  return fallbackFixtureByKickoffAndStage.get(getKickoffStageKey(kickoffAt, stageKey)) ?? null
}

function shouldUseFallbackTeam(name) {
  return typeof name !== 'string' || name.trim() === '' || normalizeTeamName(name) === 'tbd'
}

function getLocalScheduleKickoffAt(match) {
  const timeMatch = match.time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/)

  if (!timeMatch) {
    return getIsoKickoffAt(`${match.date}T12:00:00Z`)
  }

  const [, hour, minute, offset] = timeMatch
  const [year, month, day] = match.date.split('-').map(Number)

  return getIsoKickoffAt(Date.UTC(year, month - 1, day, Number(hour) - Number(offset), Number(minute)))
}

function getIsoKickoffAt(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function getKickoffStageKey(kickoffAt, stageKey) {
  return `${kickoffAt}::${stageKey}`
}

function getStageKey(stage) {
  const normalizedStage = normalizeTeamName(stage)

  if (normalizedStage === 'last32' || normalizedStage === 'roundof32') {
    return 'roundof32'
  }

  if (normalizedStage === 'last16' || normalizedStage === 'roundof16') {
    return 'roundof16'
  }

  if (normalizedStage === 'quarterfinal' || normalizedStage === 'quarterfinals') {
    return 'quarterfinal'
  }

  if (normalizedStage === 'semifinal' || normalizedStage === 'semifinals') {
    return 'semifinal'
  }

  if (normalizedStage === 'matchforthirdplace') {
    return 'thirdplace'
  }

  if (normalizedStage === 'final') {
    return 'final'
  }

  return normalizedStage || null
}

function isKnockoutSlotName(name) {
  const normalizedName = String(name ?? '').trim().toUpperCase()

  return /^(?:[12][A-L]|3[A-L](?:\/[A-L])+|[WL]\d+)$/.test(normalizedName)
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
