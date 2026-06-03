import { mergeMatchesWithFixturePreviews } from '../server/fixtureInsights'
import { mapFixtureRowsToMatches } from '../server/fixtureRows'
import { getMockMatches } from '../server/mockData'
import { fetchRssArticles } from '../server/rssNews'
import {
  fetchSupabaseFixturePreviews,
  fetchSupabaseFixtures,
  fetchSupabaseHaircutTracker,
  fetchSupabaseNews,
} from './supabaseApi'

const withLatency = (payload) => new Promise((resolve) => setTimeout(() => resolve(payload), 120))

export const fetchDashboardData = async () => {
  const supabaseFixtures = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseFixtures().catch(() => [])
  const matches = supabaseFixtures.length > 0 ? mapFixtureRowsToMatches(supabaseFixtures) : getMockMatches()
  const news = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseNews().catch(() => fetchRssArticles())
  const fixturePreviews = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseFixturePreviews().catch(() => [])
  const haircutTracker = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseHaircutTracker().catch(() => [])
  const enrichedMatches = mergeMatchesWithFixturePreviews(matches, fixturePreviews)

  return withLatency({
    liveMatches: enrichedMatches.filter((match) => match.status === 'Live'),
    upcomingMatches: enrichedMatches.slice(0, 10),
    scheduleMatches: enrichedMatches,
    news: news.slice(0, 8),
    haircutTracker,
  })
}
