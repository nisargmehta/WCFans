import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MatchDetailsView } from './MatchDetailsView'

const finalParaguayLoss = {
  id: 'usa-par-final',
  round: 'Matchday 1',
  group: 'Group D',
  date: '2026-06-12',
  time: '6:00 PM PDT',
  kickoffAt: '2026-06-13T01:00:00Z',
  ground: 'SoFi Stadium',
  minute: null,
  status: 'Final',
  home: { name: 'United States', code: 'USA', flag: '🇺🇸' },
  away: { name: 'Paraguay', code: 'PAR', flag: '🇵🇾' },
  score: { home: 2, away: 1 },
  details: {
    homeStatistics: { ball_possession: 38, shots: 5, corner_kicks: 2 },
    awayStatistics: { ball_possession: 62, shots: 11, corner_kicks: 3 },
  },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MatchDetailsView', () => {
  it('shows fan defense only beside the losing team after a final result', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<MatchDetailsView match={finalParaguayLoss} onBack={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /generate fan defense for united states/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generate fan defense for paraguay/i }))

    expect(screen.getByText(/only one team was playing football/i)).toBeInTheDocument()
  })

  it('does not show fan defense for live matches', () => {
    render(<MatchDetailsView match={{ ...finalParaguayLoss, status: 'Live' }} onBack={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /generate fan defense/i })).not.toBeInTheDocument()
  })

  it('disclaims provider score delays in the match header', () => {
    render(<MatchDetailsView match={finalParaguayLoss} onBack={vi.fn()} />)

    expect(screen.getByText(/scores and match events may be delayed/i)).toBeInTheDocument()
  })
})
