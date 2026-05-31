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
  events: [{ id: 'goal', minute: '12 min', type: 'Goal', detail: 'Finished at the near post' }],
}

describe('MatchCard', () => {
  it('expands and collapses match events', async () => {
    const user = userEvent.setup()
    render(<MatchCard match={{ ...match, status: 'Scheduled', events: [] }} />)

    const toggle = screen.getByRole('button', { name: /mexico/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/lineups and key events/i)).toBeInTheDocument()
  })

  it('shows live score and key events by default for live matches', () => {
    render(<MatchCard match={match} />)

    expect(screen.getByText('1 - 0')).toBeInTheDocument()
    expect(screen.getByText(/goal: finished at the near post/i)).toBeInTheDocument()
  })
})
