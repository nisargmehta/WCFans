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
          },
        ]}
      />,
    )

    expect(screen.getByText('Opening week travel guide')).toBeInTheDocument()
    expect(screen.getByText('Host Cities')).toBeInTheDocument()
    expect(screen.getByText('12 min ago')).toBeInTheDocument()
  })
})
