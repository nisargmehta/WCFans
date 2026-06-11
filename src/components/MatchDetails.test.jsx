import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MatchDetails } from './MatchDetails'

const match = {
  id: '537327',
  home: { name: 'Mexico', code: 'MEX', flag: '' },
  away: { name: 'South Africa', code: 'RSA', flag: '' },
  details: {
    homeFormation: '4-2-3-1',
    awayFormation: '4-4-2',
    homeLineup: [{ id: 1, name: 'Mexico Keeper', position: 'Goalkeeper', shirtNumber: 1 }],
    awayLineup: [{ id: 2, name: 'South Africa Keeper', position: 'Goalkeeper', shirtNumber: 1 }],
    homeStatistics: { ball_possession: 61, shots: 7 },
    awayStatistics: { ball_possession: 39, shots: 4 },
    goals: [
      {
        minute: 18,
        team: { name: 'Mexico' },
        scorer: { name: 'Santiago Gimenez' },
        assist: { name: 'Hirving Lozano' },
        score: { home: 1, away: 0 },
      },
    ],
    bookings: [
      {
        minute: 22,
        team: { name: 'South Africa' },
        player: { name: 'Teboho Mokoena' },
        card: 'YELLOW',
      },
    ],
    substitutions: [
      {
        minute: 63,
        team: { name: 'Mexico' },
        playerOut: { name: 'Hirving Lozano' },
        playerIn: { name: 'Uriel Antuna' },
      },
    ],
    score: {
      halfTime: { home: 1, away: 0 },
    },
    referees: [{ id: 11412, name: 'Wilton Sampaio', type: 'REFEREE', nationality: 'Brazil' }],
  },
}

describe('MatchDetails', () => {
  it('renders timeline, lineups, and stats from match details', () => {
    render(<MatchDetails match={match} />)

    expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Officials' })).toBeInTheDocument()
    expect(screen.getByText('Wilton Sampaio')).toBeInTheDocument()
    expect(screen.getByText('referee')).toBeInTheDocument()
    expect(screen.getByText('Brazil')).toBeInTheDocument()
    expect(screen.getByText('61%')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument()
    expect(screen.getByText(/santiago gimenez/i)).toBeInTheDocument()
    expect(screen.getByText('1 - 0')).toBeInTheDocument()
    expect(screen.getByText(/assist by hirving lozano/i)).toBeInTheDocument()
    expect(screen.getByText(/teboho mokoena/i)).toBeInTheDocument()
    expect(screen.getByText(/yellow card/i)).toBeInTheDocument()
    expect(screen.getByText('HT')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Lineups' })).toBeInTheDocument()
    expect(screen.queryByText('Mexico Keeper')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expand lineups' }))
    expect(screen.getByText('Mexico Keeper')).toBeInTheDocument()
  })
})
