import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const DEFAULT_RSS_FEEDS = [
  'https://www.espn.com/espn/rss/soccer/news',
  'https://www.theguardian.com/football/rss',
  'https://feeds.bbci.co.uk/sport/football/rss.xml',
]

const DEFAULT_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80'

const WORLD_CUP_PATTERN =
  /\b(world cup|fifa world cup|fifa|2026|wc\s?2026|wc sendoff|world cup sendoff|squad|roster|knockout|group stage)\b/i

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const decodeXmlEntities = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim()

const stripMarkup = (value: string) => decodeXmlEntities(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error)
  }

  return String(error)
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const tagPattern = (tagNames: string[]) => tagNames.map(escapeRegExp).join('|')

const textFrom = (xml: string, tagNames: string[]) => {
  const pattern = new RegExp(`<(?:${tagPattern(tagNames)})\\b[^>]*>([\\s\\S]*?)<\\/(?:${tagPattern(tagNames)})>`, 'i')
  const match = xml.match(pattern)

  return match ? stripMarkup(match[1]) : ''
}

const attrFrom = (xml: string, tagNames: string[], attr: string) => {
  const tagMatch = xml.match(new RegExp(`<(?:${tagPattern(tagNames)})\\b([^>]*)>`, 'i'))

  if (!tagMatch) {
    return ''
  }

  const attrMatch = tagMatch[1].match(new RegExp(`\\s${escapeRegExp(attr)}=["']([^"']+)["']`, 'i'))
  return attrMatch ? decodeXmlEntities(attrMatch[1]) : ''
}

const getFeedTitle = (xml: string, feedUrl: string) => textFrom(xml, ['title']) || new URL(feedUrl).hostname

const getArticleUrl = (item: string) => attrFrom(item, ['link'], 'href') || textFrom(item, ['link']) || textFrom(item, ['guid']) || '#'

const getArticleImage = (item: string) =>
  attrFrom(item, ['media:content'], 'url') ||
  attrFrom(item, ['media:thumbnail', 'thumbnail'], 'url') ||
  attrFrom(item, ['enclosure'], 'url') ||
  DEFAULT_ARTICLE_IMAGE

const getPublishedAt = (item: string) => textFrom(item, ['pubDate', 'published', 'updated']) || null

const isWorldCupArticle = (article: { headline: string; summary: string; category: string; source: string }) =>
  WORLD_CUP_PATTERN.test([article.headline, article.summary, article.category, article.source].filter(Boolean).join(' '))

const parseRssArticles = (xml: string, feedUrl: string) => {
  const source = getFeedTitle(xml, feedUrl)
  const items = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((match) => match[0])
  const now = new Date().toISOString()

  return items
    .map((item, index) => {
      const headline = textFrom(item, ['title'])
      const url = getArticleUrl(item)
      const summary = textFrom(item, ['description', 'summary', 'content:encoded', 'content'])

      return {
        id: normalizeId(`${source}-${headline || url || index}`),
        headline,
        summary,
        image_url: getArticleImage(item),
        category: source,
        source,
        url,
        published_at: getPublishedAt(item),
        updated_at: now,
      }
    })
    .filter((article) => article.headline && article.url !== '#' && isWorldCupArticle(article))
}

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const feeds = (Deno.env.get('RSS_FEEDS')?.split(',').map((feed) => feed.trim()).filter(Boolean) ?? DEFAULT_RSS_FEEDS)

    const feedResults = await Promise.all(
      feeds.map(async (feedUrl) => {
        try {
          const response = await fetch(feedUrl)

          if (!response.ok) {
            return { feedUrl, articles: [], error: `HTTP ${response.status}` }
          }

          return { feedUrl, articles: parseRssArticles(await response.text(), feedUrl), error: null }
        } catch (error) {
          return {
            feedUrl,
            articles: [],
            error: errorMessage(error),
          }
        }
      }),
    )

    const articles = [...new Map(feedResults.flatMap((result) => result.articles).map((article) => [article.url, article])).values()]

    if (articles.length > 0) {
      const { error } = await supabase.from('news_articles').upsert(articles, { onConflict: 'url' })

      if (error) {
        throw error
      }
    }

    return jsonResponse({
      ok: true,
      count: articles.length,
      feeds: feedResults.map((result) => ({
        feedUrl: result.feedUrl,
        count: result.articles.length,
        error: result.error,
      })),
    })
  } catch (error) {
    return jsonResponse({ ok: false, error: errorMessage(error) }, 500)
  }
})
