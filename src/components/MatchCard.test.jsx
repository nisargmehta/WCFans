import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
  details: {
    homeFormation: '4-3-3',
    awayFormation: '4-2-3-1',
    homeLineup: [{ id: 1, name: 'Mexico Keeper', position: 'Goalkeeper', shirtNumber: 1 }],
    awayLineup: [{ id: 2, name: 'South Africa Keeper', position: 'Goalkeeper', shirtNumber: 1 }],
    homeBench: [],
    awayBench: [],
    homeStatistics: { ball_possession: 55, shots: 9 },
    awayStatistics: { ball_possession: 45, shots: 6 },
  },
}

describe('MatchCard', () => {
  it('renders a summary card without expansion by default', () => {
    render(<MatchCard match={{ ...match, status: 'Scheduled', events: [] }} />)

    expect(screen.queryByRole('button', { name: /mexico/i })).not.toBeInTheDocument()
    expect(screen.getByText('Jun 11 / 13:00 UTC-6')).toBeInTheDocument()
    expect(screen.queryByText('Mexico City')).not.toBeInTheDocument()
  })

  it('does not make scheduled matches clickable for detail panels', () => {
    render(
      <MatchCard
        match={{
          ...match,
          status: 'Scheduled',
          events: [],
          details: {
            homeLineup: [],
            awayLineup: [],
          },
        }}
        onMatchSelect={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /mexico/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Mexico City')).not.toBeInTheDocument()
    expect(screen.queryByText('Lineups')).not.toBeInTheDocument()
  })

  it('opens full-page match details for live or final matches', async () => {
    const onMatchSelect = vi.fn()
    const user = userEvent.setup()
    const finalMatch = { ...match, status: 'Final' }
    render(<MatchCard match={finalMatch} onMatchSelect={onMatchSelect} />)

    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(onMatchSelect).toHaveBeenCalledWith(finalMatch)
    expect(screen.queryByText('Lineups')).not.toBeInTheDocument()
  })

  it('opens full-page match details for scheduled matches once lineups are published', async () => {
    const onMatchSelect = vi.fn()
    const user = userEvent.setup()
    const scheduledWithLineups = { ...match, status: 'Scheduled', score: { home: null, away: null } }
    render(<MatchCard match={scheduledWithLineups} onMatchSelect={onMatchSelect} />)

    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(onMatchSelect).toHaveBeenCalledWith(scheduledWithLineups)
    expect(screen.getByText('vs')).toBeInTheDocument()
  })

  it('opens full-page match details for scheduled matches once referee data is published', async () => {
    const onMatchSelect = vi.fn()
    const user = userEvent.setup()
    const scheduledWithReferee = {
      ...match,
      status: 'Scheduled',
      score: { home: null, away: null },
      details: {
        homeLineup: [],
        awayLineup: [],
        referees: [{ id: 11412, name: 'Wilton Sampaio', type: 'REFEREE' }],
      },
    }
    render(<MatchCard match={scheduledWithReferee} onMatchSelect={onMatchSelect} />)

    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(onMatchSelect).toHaveBeenCalledWith(scheduledWithReferee)
  })

  it('shows live score without expanding live matches by default', () => {
    render(<MatchCard match={match} />)

    expect(screen.getByText('1 - 0')).toBeInTheDocument()
    expect(screen.queryByText('Mexico City')).not.toBeInTheDocument()
  })

  it('collapses equivalent knockout stage and round labels', () => {
    const { container } = render(
      <MatchCard
        match={{
          ...match,
          group: 'Last 32',
          round: 'Last32',
          status: 'Scheduled',
          score: { home: null, away: null },
        }}
      />,
    )

    expect(screen.getByText('Last 32')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('Last32')
  })
})
