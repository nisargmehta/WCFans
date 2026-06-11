import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRssArticles, isWorldCupArticle, parseRssArticles } from './rssNews'

const rss = `
  <rss version="2.0">
    <channel>
      <title>Fox Sports Soccer</title>
      <item>
        <title>Mexico World Cup injury update before South Africa opener</title>
        <link>https://example.com/mexico-injury</link>
        <description><![CDATA[Mexico waits on a late fitness test.]]></description>
        <pubDate>Mon, 01 Jun 2026 12:00:00 GMT</pubDate>
        <enclosure url="https://example.com/image.jpg" type="image/jpeg" />
      </item>
    </channel>
  </rss>
`

describe('rssNews', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses RSS items into article cards', () => {
    const articles = parseRssArticles(rss, 'https://example.com/rss')

    expect(articles).toEqual([
      expect.objectContaining({
        id: 'fox-sports-soccer-mexico-world-cup-injury-update-before-south-africa-opener-12quf2v',
        headline: 'Mexico World Cup injury update before South Africa opener',
        summary: 'Mexico waits on a late fitness test.',
        image: 'https://example.com/image.jpg',
        category: 'Fox Sports Soccer',
        url: 'https://example.com/mexico-injury',
      }),
    ])
  })

  it('fetches and sorts articles from configured feeds', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-06-01T12:30:00Z').getTime())
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(rss) })

    await expect(fetchRssArticles({ feeds: ['https://example.com/rss'], fetcher })).resolves.toEqual([
      expect.objectContaining({
        headline: 'Mexico World Cup injury update before South Africa opener',
        timestamp: '30 min ago',
      }),
    ])
  })

  it('creates distinct ids for repeated headlines with different links', () => {
    const repeatedHeadlineRss = `
      <rss version="2.0">
        <channel>
          <title>World Cup Wire</title>
          <item>
            <title>World Cup squad update</title>
            <link>https://example.com/one</link>
          </item>
          <item>
            <title>World Cup squad update</title>
            <link>https://example.com/two</link>
          </item>
        </channel>
      </rss>
    `

    const articles = parseRssArticles(repeatedHeadlineRss, 'https://example.com/rss')

    expect(articles).toHaveLength(2)
    expect(new Set(articles.map((article) => article.id)).size).toBe(2)
  })

  it('filters out general football stories', () => {
    expect(
      isWorldCupArticle({
        headline: 'Club confirms new midfielder',
        summary: 'The transfer window continues.',
        category: 'Football',
        source: 'Example',
      }),
    ).toBe(false)
  })
})
