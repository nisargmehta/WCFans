import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HaircutTracker } from './HaircutTracker'

describe('HaircutTracker', () => {
  it('marks teams with five straight wins as eligible', () => {
    render(
      <HaircutTracker
        teams={[
          { id: 'MEX', team: 'Mexico', flag: '🇲🇽', group: 'A', winsInARow: 5, canCutHair: true },
          { id: 'CAN', team: 'Canada', flag: '🇨🇦', group: 'B', winsInARow: 3, canCutHair: false },
        ]}
      />,
    )

    expect(screen.getByText('Haircut tracker')).toBeInTheDocument()
    expect(screen.getByText('Eligible')).toBeInTheDocument()
    expect(screen.getByText('2 to go')).toBeInTheDocument()
  })
})
