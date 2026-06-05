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
    group: 'Group A',
    ground: 'Mexico City',
    home: { name: 'Mexico', code: 'MEX', flag: '🇲🇽' },
    away: { name: 'South Africa', code: 'RSA', flag: '🇿🇦' },
    insights: {
      refreshLabel: 'Prematch preview refreshed',
      headToHead: { summary: 'Mexico and South Africa split their previous meetings.', sources: [] },
      playersToWatch: [{ summary: 'Mexico captain enters in strong form.', sources: [] }],
      injuries: [{ summary: 'No reported injuries.', sources: [] }],
    },
  },
]

describe('ScheduleView', () => {
  it('renders schedule fixtures and returns to match hub', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<ScheduleView matches={matches} onBack={onBack} />)

    expect(screen.getByRole('heading', { name: /full world cup 2026 schedule/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /mexico/i }))

    expect(screen.getByText('Mexico City')).toBeInTheDocument()
    expect(screen.getByText(/mexico and south africa/i)).toBeInTheDocument()
    expect(screen.getByText(/mexico captain/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /match hub/i }))

    expect(onBack).toHaveBeenCalledOnce()
  })
})
