import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FanDefenseSection } from './FanDefenseSection'
import { getRecentFanDefenseMatches } from './fanDefenseMatches'

const team = (name, code, flag = '') => ({ name, code, flag })

const finalMatch = ({ id, kickoffAt, home, away, homeScore, awayScore }) => ({
  id,
  round: 'Matchday 1',
  date: kickoffAt.slice(0, 10),
  time: '12:00 PM PDT',
  kickoffAt,
  group: 'Group A',
  ground: 'Test Stadium',
  minute: null,
  status: 'Final',
  home,
  away,
  score: { home: homeScore, away: awayScore },
  details: {},
  events: [],
})

describe('FanDefenseSection', () => {
  it('surfaces the latest four losing teams from completed matches', () => {
    const matches = [
      finalMatch({ id: 'oldest', kickoffAt: '2026-06-11T19:00:00Z', home: team('Mexico', 'MEX'), away: team('South Africa', 'RSA'), homeScore: 2, awayScore: 1 }),
      finalMatch({ id: 'second', kickoffAt: '2026-06-12T19:00:00Z', home: team('Canada', 'CAN'), away: team('Japan', 'JPN'), homeScore: 0, awayScore: 1 }),
      finalMatch({ id: 'third', kickoffAt: '2026-06-13T19:00:00Z', home: team('Ghana', 'GHA'), away: team('Brazil', 'BRA'), homeScore: 1, awayScore: 3 }),
      finalMatch({ id: 'fourth', kickoffAt: '2026-06-14T19:00:00Z', home: team('France', 'FRA'), away: team('Chile', 'CHI'), homeScore: 2, awayScore: 0 }),
      finalMatch({ id: 'newest', kickoffAt: '2026-06-15T19:00:00Z', home: team('Spain', 'ESP'), away: team('Morocco', 'MAR'), homeScore: 1, awayScore: 2 }),
      finalMatch({ id: 'draw', kickoffAt: '2026-06-16T19:00:00Z', home: team('Italy', 'ITA'), away: team('Uruguay', 'URU'), homeScore: 1, awayScore: 1 }),
    ]

    expect(getRecentFanDefenseMatches(matches).map((match) => match.id)).toEqual(['newest', 'fourth', 'third', 'second'])
  })

  it('starts with losing team copy and reveals regenerate and share after generation', async () => {
    const user = userEvent.setup()
    const copyText = vi.fn().mockResolvedValue(undefined)
    const matches = [
      finalMatch({
        id: 'mex-rsa',
        kickoffAt: '2026-06-11T19:00:00Z',
        home: team('Mexico', 'MEX', '🇲🇽'),
        away: team('South Africa', 'RSA', '🇿🇦'),
        homeScore: 2,
        awayScore: 1,
      }),
    ]

    render(<FanDefenseSection matches={matches} copyText={copyText} browserNavigator={{}} />)

    expect(screen.getByText('Fan challenge')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /fan defense/i })).toBeInTheDocument()
    expect(screen.getByText('only most recent losses are here, to look at all results go to full schedule. fan defense updates after standings refresh')).toBeInTheDocument()
    expect(screen.queryByText(/latest losses, defended/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /south africa/i })).toBeInTheDocument()
    expect(screen.getByText('lost 2-1 to Mexico')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /generate fan defense for south africa/i }))

    expect(screen.getByRole('button', { name: /generate another fan defense for south africa/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /share fan defense for south africa/i }))

    expect(copyText).toHaveBeenCalledWith(expect.stringMatching(/#RsaVsMex\. https:\/\/wc-fans\.vercel\.app$/))
    expect(screen.getByRole('button', { name: /share fan defense for south africa/i })).toHaveTextContent('Shared')
  })

  it('shares native fan defense text without a title prefix', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    const matches = [
      finalMatch({
        id: 'usa-par',
        kickoffAt: '2026-06-13T01:00:00Z',
        home: team('United States', 'USA', '🇺🇸'),
        away: team('Paraguay', 'PAR', '🇵🇾'),
        homeScore: 4,
        awayScore: 1,
      }),
    ]

    render(<FanDefenseSection matches={matches} browserNavigator={{ share }} />)

    await user.click(screen.getByRole('button', { name: /generate fan defense for paraguay/i }))
    await user.click(screen.getByRole('button', { name: /share fan defense for paraguay/i }))

    expect(share).toHaveBeenCalledWith({
      text: expect.stringMatching(/#ParVsUSA\. https:\/\/wc-fans\.vercel\.app$/),
    })
  })
})
