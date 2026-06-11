import { mapFixtureRowsToMatches, sortMatchesByKickoff } from '../server/fixtureRows'
import { hasPublishedLineups } from '../server/matchDetails'
import { fetchRssArticles } from '../server/rssNews'
import {
  fetchSupabaseFixtures,
  fetchSupabaseHaircutTracker,
  fetchSupabaseNews,
  fetchSupabaseStandings,
} from './supabaseApi'

const withLatency = (payload) => new Promise((resolve) => setTimeout(() => resolve(payload), 120))

const NEWS_STORY_LIMIT = 30
const NEWS_SOURCE_LIMIT = 3

const getNewsSourceKey = (article) => (article.source || article.category || 'Unknown').toLowerCase()

export const diversifyNewsBySource = (articles, limit = NEWS_STORY_LIMIT, sourceLimit = NEWS_SOURCE_LIMIT) => {
  const sourceCounts = new Map()
  const selected = []
  const skipped = []

  articles.forEach((article) => {
    const sourceKey = getNewsSourceKey(article)
    const sourceCount = sourceCounts.get(sourceKey) ?? 0

    if (sourceCount < sourceLimit) {
      selected.push(article)
      sourceCounts.set(sourceKey, sourceCount + 1)
    } else {
      skipped.push(article)
    }
  })

  return [...selected, ...skipped].slice(0, limit)
}

export const buildDashboardPayload = ({ matches, news, haircutTracker, standings }) => {
  const enrichedMatches = sortMatchesByKickoff(matches)

  return {
    liveMatches: enrichedMatches.filter((match) => match.status === 'Live' || isPrematchWithLineups(match)),
    upcomingMatches: enrichedMatches.filter((match) => match.status === 'Scheduled' && !isPrematchWithLineups(match)).slice(0, 10),
    scheduleMatches: enrichedMatches,
    news: diversifyNewsBySource(news),
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

const isPrematchWithLineups = (match) => match.status === 'Scheduled' && hasPublishedLineups(match)
