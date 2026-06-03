import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRssArticles, parseRssArticles } from './rssNews'

const rss = `
  <rss version="2.0">
    <channel>
      <title>Fox Sports Soccer</title>
      <item>
        <title>Mexico injury update before South Africa opener</title>
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
        id: 'fox-sports-soccer-mexico-injury-update-before-south-africa-opener',
        headline: 'Mexico injury update before South Africa opener',
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
        headline: 'Mexico injury update before South Africa opener',
        timestamp: '30 min ago',
      }),
    ])
  })
})
