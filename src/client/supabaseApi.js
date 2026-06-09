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

  return rows
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
    .filter(isWorldCupArticle)
    .sort(compareArticlesByPublishedAt)
    .slice(0, 30)
}

export const fetchSupabaseFixtures = async () =>
  get(
    'fixtures?select=match_id,kickoff_at,home_team,away_team,group_name,round_name,ground,api_football_fixture_id,football_data_match_id,home_api_football_team_id,away_api_football_team_id,home_football_data_team_id,away_football_data_team_id,status,minute,home_score,away_score,score_winner,source,match_details_synced_at,home_formation,away_formation,home_lineup,away_lineup,home_bench,away_bench,home_statistics,away_statistics,goals,bookings,substitutions,penalties,score_detail&source=eq.football-data&order=kickoff_at.asc&limit=200',
  )

export const fetchSupabaseStandings = async () =>
  get(
    'standings?select=league_id,season,team_id,team_name,team_logo,group_name,rank,points,goals_diff,form,status,description,all_played,all_win,all_draw,all_lose,goals_for,goals_against,fetched_at&league_id=eq.2000&season=eq.2026&order=group_name.asc.nullslast,rank.asc.nullslast',
  )

export const fetchSupabaseHaircutTracker = async () => {
  const rows = await get(
    'haircut_tracker?select=team_id,team_name,team_logo,group_name,form,wins_in_a_row,can_cut_hair,fetched_at&league_id=eq.2000&season=eq.2026&order=wins_in_a_row.desc,team_name.asc',
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

const compareArticlesByPublishedAt = (first, second) => {
  const firstTime = getPublishedAtTime(first.publishedAt)
  const secondTime = getPublishedAtTime(second.publishedAt)

  return secondTime - firstTime
}

const getPublishedAtTime = (publishedAt) => {
  if (!publishedAt) {
    return 0
  }

  const publishedTime = new Date(publishedAt).getTime()
  return Number.isNaN(publishedTime) ? 0 : publishedTime
}
