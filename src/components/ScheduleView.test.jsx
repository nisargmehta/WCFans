import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ScheduleView } from './ScheduleView'

const matches = [
  {
    id: 'mex-rsa',
    round: 'Matchday 1',
    date: '2026-06-11',
    time: '13:00 UTC-6',
    kickoffAt: '2026-06-11T19:00:00.000Z',
    group: 'Group A',
    ground: 'Mexico City',
    status: 'Final',
    score: { home: 2, away: 1 },
    home: { name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
    away: { name: 'South Africa', code: 'RSA', flag: '🇿🇦' },
    details: {
      homeFormation: '4-3-3',
      awayFormation: '4-4-2',
      homeLineup: [{ id: 1, name: 'Mexico Keeper', position: 'Goalkeeper' }],
      awayLineup: [{ id: 2, name: 'South Africa Keeper', position: 'Goalkeeper' }],
      homeStatistics: { shots: 11 },
      awayStatistics: { shots: 8 },
    },
  },
]

describe('ScheduleView', () => {
  it('renders schedule fixtures and returns to match hub', async () => {
    const onBack = vi.fn()
    const onMatchSelect = vi.fn()
    const user = userEvent.setup()
    render(<ScheduleView matches={matches} onBack={onBack} onMatchSelect={onMatchSelect} />)

    expect(screen.getByRole('heading', { name: /full world cup 2026 schedule/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(onMatchSelect).toHaveBeenCalledWith(matches[0])

    await user.click(screen.getByRole('button', { name: /match hub/i }))

    expect(onBack).toHaveBeenCalledOnce()
  })

  it('keeps same-day fixtures in kickoff order', () => {
    const sameDayMatches = [
      {
        ...matches[0],
        id: 'six-pm-match',
        date: '2026-06-13',
        time: '6:00 PM PDT',
        kickoffAt: '2026-06-14T01:00:00.000Z',
        home: { name: 'Six PM Home', code: 'SPH', flag: '' },
        away: { name: 'Six PM Away', code: 'SPA', flag: '' },
      },
      {
        ...matches[0],
        id: 'noon-match',
        date: '2026-06-13',
        time: '12:00 PM PDT',
        kickoffAt: '2026-06-13T19:00:00.000Z',
        home: { name: 'Noon Home', code: 'NOH', flag: '' },
        away: { name: 'Noon Away', code: 'NOA', flag: '' },
      },
      {
        ...matches[0],
        id: 'three-pm-match',
        date: '2026-06-13',
        time: '3:00 PM PDT',
        kickoffAt: '2026-06-13T22:00:00.000Z',
        home: { name: 'Three PM Home', code: 'TPH', flag: '' },
        away: { name: 'Three PM Away', code: 'TPA', flag: '' },
      },
    ]

    render(<ScheduleView matches={sameDayMatches} onBack={vi.fn()} />)

    const scheduleText = screen.getByRole('heading', { name: /sat, jun 13/i }).parentElement.textContent

    expect(screen.queryByRole('heading', { name: /sun, jun 14/i })).not.toBeInTheDocument()
    expect(scheduleText.indexOf('Noon Home')).toBeLessThan(scheduleText.indexOf('Three PM Home'))
    expect(scheduleText.indexOf('Three PM Home')).toBeLessThan(scheduleText.indexOf('Six PM Home'))
  })
})
