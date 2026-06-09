import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LiveScoresTicker } from './LiveScoresTicker'

const liveMatch = {
  id: 'mex-rsa',
  minute: 27,
  home: { flag: '🇲🇽', code: 'MEX' },
  away: { flag: '🇿🇦', code: 'RSA' },
  score: { home: 1, away: 0 },
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
    expect(screen.getAllByText(/MEX/i)[0]).toBeInTheDocument()
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText("27' played")).toBeInTheDocument()
  })
})
