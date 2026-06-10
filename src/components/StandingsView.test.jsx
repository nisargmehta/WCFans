import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StandingsView } from './StandingsView'

const standings = [
  { group_name: 'Group B', team_id: 5, team_name: 'Canada', rank: 5, points: 0, goals_diff: 0 },
  { group_name: 'Group B', team_id: 6, team_name: 'Bosnia-Herzegovina', rank: 6, points: 0, goals_diff: 0 },
  { group_name: 'Group B', team_id: 9, team_name: 'Qatar', rank: 9, points: 0, goals_diff: 0 },
  { group_name: 'Group B', team_id: 10, team_name: 'Switzerland', rank: 10, points: 0, goals_diff: 0 },
]

describe('StandingsView', () => {
  it('displays group-local positions instead of global rank values', () => {
    render(<StandingsView standings={standings} onBack={vi.fn()} />)

    const groupTable = screen.getByRole('heading', { name: 'Group B' }).closest('section')
    const rows = within(groupTable).getAllByRole('row').slice(1)

    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['1', '2', '3', '4'])
    expect(within(rows[0]).getByText('Canada')).toBeInTheDocument()
    expect(within(rows[3]).getByText('Switzerland')).toBeInTheDocument()
  })
})
