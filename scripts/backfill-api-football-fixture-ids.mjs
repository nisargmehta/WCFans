const DEFAULT_SUPABASE_URL = 'https://qhkglztddsowhgjqskqz.supabase.co'
const DEFAULT_API_FOOTBALL_LEAGUE_ID = '1'
const DEFAULT_API_FOOTBALL_SEASON = '2026'
const MATCH_WINDOW_HOURS = 18

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const apiFootballKey = process.env.API_FOOTBALL_KEY
const leagueId = process.env.API_FOOTBALL_LEAGUE_ID || DEFAULT_API_FOOTBALL_LEAGUE_ID
const season = process.env.API_FOOTBALL_SEASON || DEFAULT_API_FOOTBALL_SEASON

if (!serviceRoleKey) {
  throw new Error('Set SERVICE_ROLE_KEY before running this script.')
}

if (!apiFootballKey) {
  throw new Error('Set API_FOOTBALL_KEY before running this script.')
}

const aliases = new Map([
  ['bosnia & herzegovina', 'bosnia and herzegovina'],
  ['czech republic', 'czechia'],
  ['south korea', 'korea republic'],
  ['usa', 'united states'],
])

const normalizeTeam = (value) => {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  return aliases.get(normalized) ?? normalized
}

const chunk = (items, size) => {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

const getJson = async (url, headers) => {
  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${await response.text()}`)
  }

  return response.json()
}

const fetchSupabaseFixtures = async () => {
  const query = [
    'select=match_id,kickoff_at,home_team,away_team,group_name,round_name,ground,api_football_fixture_id,home_api_football_team_id,away_api_football_team_id',
    'order=kickoff_at.asc',
  ].join('&')

  return getJson(`${supabaseUrl}/rest/v1/fixtures?${query}`, {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  })
}

const fetchApiFootballFixtures = async () =>
  getJson(`https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`, {
    'x-apisports-key': apiFootballKey,
  })

const teamKey = (homeTeam, awayTeam) => `${normalizeTeam(homeTeam)}__${normalizeTeam(awayTeam)}`

const indexApiFixtures = (fixtures) => {
  const byTeams = new Map()

  for (const item of fixtures) {
    const homeName = item.teams?.home?.name
    const awayName = item.teams?.away?.name

    if (!homeName || !awayName) {
      continue
    }

    const key = teamKey(homeName, awayName)
    byTeams.set(key, [...(byTeams.get(key) ?? []), item])
  }

  return byTeams
}

const findBestMatch = (fixture, apiFixturesByTeams) => {
  const candidates = apiFixturesByTeams.get(teamKey(fixture.home_team, fixture.away_team)) ?? []
  const kickoffTime = new Date(fixture.kickoff_at).getTime()

  return candidates
    .map((candidate) => ({
      candidate,
      hoursApart: Math.abs(new Date(candidate.fixture.date).getTime() - kickoffTime) / 3600000,
    }))
    .filter(({ hoursApart }) => hoursApart <= MATCH_WINDOW_HOURS)
    .sort((a, b) => a.hoursApart - b.hoursApart)[0]?.candidate
}

const upsertFixtureIds = async (fixtures) => {
  let updatedCount = 0

  for (const batch of chunk(fixtures, 50)) {
    const response = await fetch(`${supabaseUrl}/rest/v1/fixtures?on_conflict=match_id`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    })

    if (!response.ok) {
      throw new Error(`Fixture ID backfill failed: ${response.status} ${await response.text()}`)
    }

    updatedCount += batch.length
  }

  return updatedCount
}

const supabaseFixtures = await fetchSupabaseFixtures()
const apiFootballData = await fetchApiFootballFixtures()
const apiFootballFixtures = apiFootballData.response ?? []
const apiFixturesByTeams = indexApiFixtures(apiFootballFixtures)
const now = new Date().toISOString()
const matched = []
const unmatched = []

for (const fixture of supabaseFixtures) {
  const apiFixture = findBestMatch(fixture, apiFixturesByTeams)

  if (!apiFixture) {
    unmatched.push(`${fixture.match_id}: ${fixture.home_team} vs ${fixture.away_team} at ${fixture.kickoff_at}`)
    continue
  }

  matched.push({
    ...fixture,
    api_football_fixture_id: apiFixture.fixture.id,
    home_api_football_team_id: apiFixture.teams.home.id,
    away_api_football_team_id: apiFixture.teams.away.id,
    updated_at: now,
  })
}

const updatedCount = matched.length > 0 ? await upsertFixtureIds(matched) : 0

console.log(`Fetched ${apiFootballFixtures.length} API-Football fixtures for league ${leagueId}, season ${season}.`)
console.log(`Updated ${updatedCount} Supabase fixtures with API-Football IDs.`)

if (unmatched.length > 0) {
  console.log(`Unmatched fixtures (${unmatched.length}):`)
  for (const item of unmatched) {
    console.log(`- ${item}`)
  }
}
