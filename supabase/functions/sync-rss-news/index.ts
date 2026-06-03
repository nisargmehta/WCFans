import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { firstEnv, jsonResponse, requireEnv } from '../_shared/http.ts'

const DEFAULT_RSS_FEEDS = [
  'https://api.foxsports.com/v2/content/optimized-rss',
  'https://rss.feedspot.com/soccer_rss_feeds/',
]

const DEFAULT_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80'

const textFrom = (node: Element, selector: string) => node.querySelector(selector)?.textContent?.trim() ?? ''

const attrFrom = (node: Element, selector: string, attr: string) =>
  node.querySelector(selector)?.getAttribute(attr)?.trim() ?? ''

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const stripMarkup = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const getFeedTitle = (document: Document, feedUrl: string) =>
  textFrom(document.documentElement, 'channel > title') ||
  textFrom(document.documentElement, 'feed > title') ||
  new URL(feedUrl).hostname

const getArticleUrl = (item: Element) =>
  attrFrom(item, 'link', 'href') || textFrom(item, 'link') || textFrom(item, 'guid') || '#'

const getArticleImage = (item: Element) =>
  attrFrom(item, 'media\\:content, content', 'url') ||
  attrFrom(item, 'media\\:thumbnail, thumbnail', 'url') ||
  attrFrom(item, 'enclosure', 'url') ||
  DEFAULT_ARTICLE_IMAGE

const getPublishedAt = (item: Element) =>
  textFrom(item, 'pubDate') || textFrom(item, 'published') || textFrom(item, 'updated') || null

const parseRssArticles = (xml: string, feedUrl: string) => {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const source = getFeedTitle(document, feedUrl)
  const items = [...document.querySelectorAll('item, entry')]
  const now = new Date().toISOString()

  return items
    .map((item, index) => {
      const headline = textFrom(item, 'title')
      const url = getArticleUrl(item)
      const summary = stripMarkup(textFrom(item, 'description') || textFrom(item, 'summary') || textFrom(item, 'content'))

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
    .filter((article) => article.headline && article.url !== '#')
}

Deno.serve(async () => {
  try {
    const supabase = createClient(requireEnv('SUPABASE_URL'), firstEnv('SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'))
    const feeds = (Deno.env.get('RSS_FEEDS')?.split(',').map((feed) => feed.trim()).filter(Boolean) ?? DEFAULT_RSS_FEEDS)

    const articleGroups = await Promise.all(
      feeds.map(async (feedUrl) => {
        try {
          const response = await fetch(feedUrl)

          if (!response.ok) {
            return []
          }

          return parseRssArticles(await response.text(), feedUrl)
        } catch {
          return []
        }
      }),
    )

    const articles = articleGroups.flat()

    if (articles.length > 0) {
      const { error } = await supabase.from('news_articles').upsert(articles, { onConflict: 'url' })

      if (error) {
        throw error
      }
    }

    return jsonResponse({ ok: true, count: articles.length })
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
