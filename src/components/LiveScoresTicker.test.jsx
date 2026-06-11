import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LiveScoresTicker } from './LiveScoresTicker'

const liveMatch = {
  id: 'mex-rsa',
  status: 'Live',
  minute: 27,
  home: { flag: '🇲🇽', code: 'MEX', name: 'Mexico' },
  away: { flag: '🇿🇦', code: 'RSA', name: 'South Africa' },
  score: { home: 1, away: 0 },
  details: {
    homeLineup: [{ id: 1, name: 'Mexico Keeper', position: 'Goalkeeper' }],
    awayLineup: [{ id: 2, name: 'South Africa Keeper', position: 'Goalkeeper' }],
    homeStatistics: { shots: 7 },
    awayStatistics: { shots: 4 },
  },
}

const lineupMatch = {
  ...liveMatch,
  id: 'lineups-posted',
  status: 'Scheduled',
  minute: null,
  score: { home: null, away: null },
}

describe('LiveScoresTicker', () => {
  it('renders a placeholder instead of the live banner when there are no live matches', () => {
    render(<LiveScoresTicker matches={[]} />)

    expect(screen.getByLabelText(/live scores/i)).toBeInTheDocument()
    expect(screen.getByText(/no live matches right now/i)).toBeInTheDocument()
    expect(screen.queryByText(/^live$/i)).not.toBeInTheDocument()
  })

  it('renders live match score and minute', () => {
    render(<LiveScoresTicker matches={[liveMatch]} />)

    expect(screen.getByLabelText(/live scores ticker/i)).toBeInTheDocument()
    expect(screen.getAllByText(/mexico/i)[0]).toBeInTheDocument()
    expect(screen.getByText('South Africa')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText("27'")).toBeInTheDocument()
  })

  it('opens live match details when a live card is clicked', async () => {
    const onMatchSelect = vi.fn()
    const user = userEvent.setup()
    render(<LiveScoresTicker matches={[liveMatch]} onMatchSelect={onMatchSelect} />)

    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(onMatchSelect).toHaveBeenCalledWith(liveMatch)
    expect(screen.queryByText('Lineups')).not.toBeInTheDocument()
  })

  it('renders scheduled fixtures with lineups as tappable detail cards', async () => {
    const onMatchSelect = vi.fn()
    const user = userEvent.setup()
    render(<LiveScoresTicker matches={[lineupMatch]} onMatchSelect={onMatchSelect} />)

    expect(screen.getByText('Match details')).toBeInTheDocument()
    expect(screen.getByText('Lineups posted')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(onMatchSelect).toHaveBeenCalledWith(lineupMatch)
  })
})
