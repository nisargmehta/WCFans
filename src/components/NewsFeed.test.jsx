import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NewsFeed } from './NewsFeed'

describe('NewsFeed', () => {
  it('renders article headlines, categories, and timestamps', () => {
    render(
      <NewsFeed
        articles={[
          {
            id: 'a1',
            headline: 'Opening week travel guide',
            timestamp: '12 min ago',
            image: 'https://example.com/image.jpg',
            category: 'Host Cities',
            url: 'https://example.com/article',
          },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Opening week travel guide' })).toHaveAttribute(
      'href',
      'https://example.com/article',
    )
    expect(screen.getByText('Host Cities')).toBeInTheDocument()
    expect(screen.getByText('12 min ago')).toBeInTheDocument()
  })

  it('renders an empty state when RSS articles are unavailable', () => {
    render(<NewsFeed articles={[]} />)

    expect(screen.getByText(/latest rss stories/i)).toBeInTheDocument()
  })
})
