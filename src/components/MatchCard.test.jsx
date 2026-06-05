import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MatchCard } from './MatchCard'

const match = {
  id: 'mex-rsa',
  round: 'Matchday 1',
  group: 'Group A',
  date: '2026-06-11',
  time: '13:00 UTC-6',
  ground: 'Mexico City',
  minute: 27,
  status: 'Live',
  home: { name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
  away: { name: 'South Africa', code: 'RSA', flag: '🇿🇦' },
  score: { home: 1, away: 0 },
  events: [],
  insights: {
    refreshLabel: 'Prematch preview pending',
    headToHead: { summary: 'Head-to-head record will appear after the preview job runs.', sources: [] },
    playersToWatch: [{ summary: 'Mexico forward listed among players to watch.', sources: [] }],
    injuries: [{ summary: 'Injury updates will appear after the preview job runs.', sources: [] }],
  },
}

describe('MatchCard', () => {
  it('renders a summary card without expansion by default', () => {
    render(<MatchCard match={{ ...match, status: 'Scheduled', events: [] }} />)

    expect(screen.queryByRole('button', { name: /mexico/i })).not.toBeInTheDocument()
    expect(screen.getByText('13:00 UTC-6')).toBeInTheDocument()
    expect(screen.queryByText('Mexico City')).not.toBeInTheDocument()
  })

  it('expands and collapses match details when enabled', async () => {
    const user = userEvent.setup()
    render(<MatchCard match={{ ...match, status: 'Scheduled', events: [] }} expandable />)

    const toggle = screen.getByRole('button', { name: /mexico/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Mexico City')).toBeInTheDocument()
    expect(screen.getByText(/mexico forward/i)).toBeInTheDocument()
  })

  it('shows live score without expanding live matches by default', () => {
    render(<MatchCard match={match} />)

    expect(screen.getByText('1 - 0')).toBeInTheDocument()
    expect(screen.queryByText('Mexico City')).not.toBeInTheDocument()
  })
})
