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
  it('renders live match score and minute', () => {
    render(<LiveScoresTicker matches={[liveMatch]} />)

    expect(screen.getByLabelText(/live scores ticker/i)).toBeInTheDocument()
    expect(screen.getAllByText(/MEX/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText('1 - 0')[0]).toBeInTheDocument()
    expect(screen.getAllByText("27'")[0]).toBeInTheDocument()
  })
})
