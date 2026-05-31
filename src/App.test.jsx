import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('loads the dashboard sections from the client API', async () => {
    render(<App />)

    expect(screen.getByText(/loading the match hub/i)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /live and upcoming fixtures/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /world cup stories/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /haircut tracker/i })).toBeInTheDocument()
  })
})
