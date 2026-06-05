import { isWorldCupArticle } from '../server/rssNews'

const DEFAULT_SUPABASE_URL = 'https://qhkglztddsowhgjqskqz.supabase.co'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = Boolean(supabaseUrl && supabasePublishableKey)

const headers = {
  apikey: supabasePublishableKey,
  Authorization: `Bearer ${supabasePublishableKey}`,
}

const get = async (path) => {
  if (!isConfigured) {
    return []
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers })

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${path}`)
  }

  return response.json()
}

export const fetchSupabaseNews = async () => {
  const rows = await get(
    'news_articles?select=id,headline,summary,image_url,category,source,url,published_at&order=published_at.desc.nullslast&limit=80',
  )

  return limitPerSource(
    rows
      .map((row) => ({
        id: row.id,
        headline: row.headline,
        summary: row.summary,
        image: row.image_url,
        category: row.category || row.source || 'News',
        source: row.source,
        url: row.url,
        timestamp: formatTimestamp(row.published_at),
        publishedAt: row.published_at,
      }))
      .filter(isWorldCupArticle),
  ).slice(0, 8)
}

export const fetchSupabaseFixturePreviews = async () =>
  get(
    'fixture_previews?select=match_id,generated_at,refresh_label,head_to_head_summary,head_to_head_sources,players_to_watch,injuries,updated_at&order=updated_at.desc&limit=200',
  )

export const fetchSupabaseFixtures = async () =>
  get(
    'fixtures?select=match_id,kickoff_at,home_team,away_team,group_name,round_name,ground,api_football_fixture_id,home_api_football_team_id,away_api_football_team_id,source&source=eq.api-football&order=kickoff_at.asc&limit=200',
  )

export const fetchSupabaseStandings = async () =>
  get(
    'standings?select=league_id,season,team_id,team_name,team_logo,group_name,rank,points,goals_diff,form,status,description,all_played,all_win,all_draw,all_lose,goals_for,goals_against,fetched_at&league_id=eq.1&season=eq.2026&order=group_name.asc.nullslast,rank.asc.nullslast',
  )

export const fetchSupabaseHaircutTracker = async () => {
  const rows = await get(
    'haircut_tracker?select=team_id,team_name,team_logo,group_name,form,wins_in_a_row,can_cut_hair,fetched_at&league_id=eq.1&season=eq.2026&order=wins_in_a_row.desc,team_name.asc',
  )

  return rows.map((row) => ({
    id: String(row.team_id),
    team: row.team_name,
    logo: row.team_logo,
    group: row.group_name?.replace(/^Group\s+/i, '') ?? 'TBD',
    form: row.form,
    winsInARow: row.wins_in_a_row,
    canCutHair: row.can_cut_hair,
    fetchedAt: row.fetched_at,
  }))
}

const formatTimestamp = (publishedAt) => {
  if (!publishedAt) {
    return 'Latest'
  }

  const publishedDate = new Date(publishedAt)
  if (Number.isNaN(publishedDate.getTime())) {
    return 'Latest'
  }

  const diffMinutes = Math.max(1, Math.round((Date.now() - publishedDate.getTime()) / 60000))
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const limitPerSource = (articles, maxPerSource = 3) => {
  const sourceCounts = new Map()

  return articles.filter((article) => {
    const source = article.source || article.category || 'News'
    const count = sourceCounts.get(source) ?? 0

    if (count >= maxPerSource) {
      return false
    }

    sourceCounts.set(source, count + 1)
    return true
  })
}
