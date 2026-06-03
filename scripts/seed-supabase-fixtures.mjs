import { readFile } from 'node:fs/promises'

const DEFAULT_SUPABASE_URL = 'https://qhkglztddsowhgjqskqz.supabase.co'

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  throw new Error('Set SERVICE_ROLE_KEY before running this script.')
}

const schedule = JSON.parse(await readFile(new URL('../src/data/worldcup2026.json', import.meta.url), 'utf8'))

const matchId = (match) => `${match.date}-${match.team1}-${match.team2}`.toLowerCase().replaceAll(' ', '-')

const kickoffAt = (match) => {
  const timeMatch = match.time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/)
  if (!timeMatch) {
    return new Date(`${match.date}T12:00:00Z`).toISOString()
  }

  const [, hour, minute, offset] = timeMatch
  const [year, month, day] = match.date.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day, Number(hour) - Number(offset), Number(minute))).toISOString()
}

const chunk = (items, size) => {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

const rows = schedule.matches.map((match) => ({
  match_id: matchId(match),
  kickoff_at: kickoffAt(match),
  home_team: match.team1,
  away_team: match.team2,
  group_name: match.group ?? null,
  round_name: match.round ?? null,
  ground: match.ground ?? null,
  source: 'local',
  updated_at: new Date().toISOString(),
}))

let upsertedCount = 0

for (const batch of chunk(rows, 50)) {
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
    throw new Error(`Fixture seed failed: ${response.status} ${await response.text()}`)
  }

  upsertedCount += batch.length
}

console.log(`Upserted ${upsertedCount} fixtures.`)
