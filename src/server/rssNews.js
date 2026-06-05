const DEFAULT_RSS_FEEDS = [
  'https://www.espn.com/espn/rss/soccer/news',
  'https://www.theguardian.com/football/rss',
  'https://feeds.bbci.co.uk/sport/football/rss.xml',
]

const DEFAULT_TIMEOUT_MS = 3000

const DEFAULT_ARTICLE_IMAGE =
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80'

const textFrom = (node, selector) => node.querySelector(selector)?.textContent?.trim() ?? ''

const attrFrom = (node, selector, attr) => node.querySelector(selector)?.getAttribute(attr)?.trim() ?? ''

const normalizeId = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const stripMarkup = (value) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const getFeedTitle = (document, feedUrl) =>
  textFrom(document, 'channel > title') || textFrom(document, 'feed > title') || new URL(feedUrl).hostname

const getArticleUrl = (item) =>
  attrFrom(item, 'link', 'href') || textFrom(item, 'link') || textFrom(item, 'guid') || '#'

const getArticleImage = (item) =>
  attrFrom(item, 'media\\:content, content', 'url') ||
  attrFrom(item, 'media\\:thumbnail, thumbnail', 'url') ||
  attrFrom(item, 'enclosure', 'url') ||
  DEFAULT_ARTICLE_IMAGE

const getPublishedAt = (item) =>
  textFrom(item, 'pubDate') || textFrom(item, 'published') || textFrom(item, 'updated') || ''

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

export const parseRssArticles = (xml, feedUrl) => {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const parserError = document.querySelector('parsererror')

  if (parserError) {
    throw new Error(`Could not parse RSS feed: ${feedUrl}`)
  }

  const source = getFeedTitle(document, feedUrl)
  const items = [...document.querySelectorAll('item, entry')]

  return items
    .map((item, index) => {
      const headline = textFrom(item, 'title')
      const url = getArticleUrl(item)
      const publishedAt = getPublishedAt(item)
      const summary = stripMarkup(textFrom(item, 'description') || textFrom(item, 'summary') || textFrom(item, 'content'))

      return {
        id: normalizeId(`${source}-${headline || url || index}`),
        headline,
        summary,
        timestamp: formatTimestamp(publishedAt),
        publishedAt,
        image: getArticleImage(item),
        category: source,
        url,
        source,
      }
    })
    .filter((article) => article.headline)
}

const fetchWithTimeout = async (feedUrl, fetcher, timeoutMs) => {
  const controller = typeof AbortController === 'undefined' ? null : new AbortController()
  const timeout = controller ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : null

  try {
    return await fetcher(feedUrl, controller ? { signal: controller.signal } : undefined)
  } finally {
    if (timeout) {
      globalThis.clearTimeout(timeout)
    }
  }
}

export const fetchRssArticles = async ({
  feeds = DEFAULT_RSS_FEEDS,
  fetcher = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) => {
  const articleGroups = await Promise.all(
    feeds.map(async (feedUrl) => {
      try {
        const response = await fetchWithTimeout(feedUrl, fetcher, timeoutMs)

        if (!response.ok) {
          return []
        }

        return parseRssArticles(await response.text(), feedUrl)
      } catch {
        return []
      }
    }),
  )

  return articleGroups
    .flat()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}
