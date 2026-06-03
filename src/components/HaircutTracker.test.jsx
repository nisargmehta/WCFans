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
    expect(screen.getByText(/streaks will appear/i)).toBeInTheDocument()
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

  it('shares a generated PNG card with the tracker URL when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)
    const shareCard = new File(['card'], 'mexico-haircut-tracker.png', { type: 'image/png' })
    const createShareCard = vi.fn().mockResolvedValue(shareCard)
    Object.defineProperty(window, 'navigator', {
      configurable: true,
      value: {
        ...window.navigator,
        canShare,
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
        teams={[{ id: 'MEX', team: 'Mexico', flag: '🇲🇽', group: 'A', winsInARow: 5, canCutHair: true }]}
        createShareCard={createShareCard}
      />,
    )

    await user.click(screen.getByRole('button', { name: /share mexico haircut tracker/i }))

    expect(createShareCard).toHaveBeenCalledWith(expect.objectContaining({ team: 'Mexico' }))
    expect(canShare).toHaveBeenCalledWith({ files: [shareCard] })
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Mexico just hit 5 straight wins'),
        url: expect.any(String),
        files: [shareCard],
      }),
    )
    expect(screen.getByRole('button', { name: /share mexico haircut tracker/i })).toHaveTextContent('Shared')
  })

  it('returns punchlines for each streak stage', () => {
    expect(getHaircutPunchline(0)).toBe('Forget about the cut.')
    expect(getHaircutPunchline(1)).toBe("That's a start.")
    expect(getHaircutPunchline(4)).toBe("One more and it's chair time.")
    expect(getHaircutPunchline(5)).toBe('Woohoo, time for a cut.')
  })
})
