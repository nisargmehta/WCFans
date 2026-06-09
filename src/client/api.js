import { mapFixtureRowsToMatches, sortMatchesByKickoff } from '../server/fixtureRows'
import { fetchRssArticles } from '../server/rssNews'
import {
  fetchSupabaseFixtures,
  fetchSupabaseHaircutTracker,
  fetchSupabaseNews,
  fetchSupabaseStandings,
} from './supabaseApi'

const withLatency = (payload) => new Promise((resolve) => setTimeout(() => resolve(payload), 120))

export const buildDashboardPayload = ({ matches, news, haircutTracker, standings }) => {
  const enrichedMatches = sortMatchesByKickoff(matches)

  return {
    liveMatches: enrichedMatches.filter((match) => match.status === 'Live'),
    upcomingMatches: enrichedMatches.filter((match) => match.status === 'Scheduled').slice(0, 10),
    scheduleMatches: enrichedMatches,
    news: news.slice(0, 30),
    haircutTracker,
    standings,
  }
}

export const fetchDashboardData = async () => {
  const supabaseFixtures = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseFixtures().catch(() => [])
  const matches = mapFixtureRowsToMatches(supabaseFixtures)
  const news = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseNews().catch(() => fetchRssArticles())
  const haircutTracker = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseHaircutTracker().catch(() => [])
  const standings = import.meta.env.MODE === 'test' ? [] : await fetchSupabaseStandings().catch(() => [])

  return withLatency(buildDashboardPayload({
    matches,
    news,
    haircutTracker,
    standings,
  }))
}

