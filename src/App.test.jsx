import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('opens the full real schedule view', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /full schedule/i }))

    expect(screen.getByRole('heading', { name: /full world cup 2026 schedule/i })).toBeInTheDocument()
    expect(screen.getByText('0 fixtures')).toBeInTheDocument()
    expect(screen.getByText(/fixtures will appear here/i)).toBeInTheDocument()
  })

  it('opens the standings view', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /standings/i }))

    expect(screen.getByRole('heading', { name: /world cup 2026 standings/i })).toBeInTheDocument()
    expect(screen.getByText('0 teams')).toBeInTheDocument()
    expect(screen.getByText(/standings will appear here/i)).toBeInTheDocument()
  })
})
