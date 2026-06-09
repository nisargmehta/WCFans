import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HaircutTracker } from './HaircutTracker'
import { getHaircutPunchline } from './haircutTrackerCopy'

describe('HaircutTracker', () => {
  it('shows a no-data state until standings streaks are available', () => {
    render(<HaircutTracker teams={[]} />)

    expect(screen.getByText('Haircut tracker')).toBeInTheDocument()
    expect(screen.getByText('No streak data')).toBeInTheDocument()
    expect(screen.getByText(/haircut streaks update after standings refresh/i)).toBeInTheDocument()
    expect(screen.queryByText(/until then/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument()
  })

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
    expect(screen.getByText('Woohoo, time for a cut.')).toBeInTheDocument()
    expect(screen.getByText('The barber is watching.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share mexico haircut tracker/i })).toBeInTheDocument()
  })

  it('shares the tracker caption and link as text', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: {
        ...window.navigator,
        share,
      },
    })
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: window.navigator,
    })

    const user = userEvent.setup()
    render(
      <HaircutTracker
        teams={[{ id: 'USA', team: 'Team USA', flag: '🇺🇸', group: 'D', winsInARow: 4, canCutHair: false }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /share team usa haircut tracker/i }))

    expect(share).toHaveBeenCalledWith({
      title: 'Team USA haircut tracker',
      text: 'Haircut tracker: Team USA 🇺🇸 at 4/5 wins. One more and it\'s chair time!! check it out here:\nhttps://wc-fans.vercel.app',
    })
    expect(screen.getByRole('button', { name: /share team usa haircut tracker/i })).toHaveTextContent('Shared')
  })

  it('copies the tracker caption and link when native share is unavailable', async () => {
    const copyText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: {
        ...window.navigator,
        share: undefined,
      },
    })
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: window.navigator,
    })

    const user = userEvent.setup()
    render(
      <HaircutTracker
        teams={[{ id: 'USA', team: 'Team USA', flag: '🇺🇸', group: 'D', winsInARow: 4, canCutHair: false }]}
        copyText={copyText}
      />,
    )

    await user.click(screen.getByRole('button', { name: /share team usa haircut tracker/i }))

    expect(copyText).toHaveBeenCalledWith(
      'Haircut tracker: Team USA 🇺🇸 at 4/5 wins. One more and it\'s chair time!! check it out here:\nhttps://wc-fans.vercel.app',
    )
    expect(screen.getByRole('button', { name: /share team usa haircut tracker/i })).toHaveTextContent('Shared')
  })

  it('returns punchlines for each streak stage', () => {
    expect(getHaircutPunchline(0)).toBe('Forget about the cut.')
    expect(getHaircutPunchline(1)).toBe("That's a start.")
    expect(getHaircutPunchline(4)).toBe("One more and it's chair time.")
    expect(getHaircutPunchline(5)).toBe('Woohoo, time for a cut.')
  })
})
