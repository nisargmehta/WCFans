import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const importAnalytics = async () => {
  vi.resetModules()
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key')
  return import('./analytics')
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('analytics', () => {
  it('flushes clicks when the queue reaches twenty events', async () => {
    const { CLICK_EVENTS, trackClick } = await importAnalytics()

    for (let index = 0; index < 19; index += 1) {
      trackClick(CLICK_EVENTS.STANDINGS_OPEN_CLICK, {
        featureArea: 'match_center',
        pageView: 'home',
      })
    }

    expect(fetch).not.toHaveBeenCalled()

    trackClick(CLICK_EVENTS.STANDINGS_OPEN_CLICK, {
      featureArea: 'match_center',
      pageView: 'home',
    })

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())

    const request = fetch.mock.calls[0]
    const events = JSON.parse(request[1].body)

    expect(request[0]).toBe('https://qhkglztddsowhgjqskqz.supabase.co/rest/v1/analytics_events')
    expect(events).toHaveLength(20)
    expect(events[0]).toMatchObject({
      event_type: 'click',
      event_name: 'standings_open_click',
      feature_area: 'match_center',
      page_view: 'home',
    })
    expect(window.localStorage.getItem('wcfans-analytics-queue')).toBe('[]')
  })

  it('flushes queued clicks every minute', async () => {
    vi.useFakeTimers()
    const { CLICK_EVENTS, trackClick } = await importAnalytics()

    trackClick(CLICK_EVENTS.SCHEDULE_OPEN_CLICK, {
      featureArea: 'match_center',
      pageView: 'home',
    })

    await vi.advanceTimersByTimeAsync(60 * 1000)

    expect(fetch).toHaveBeenCalledOnce()
  })

  it('flushes queued clicks when the page is backgrounded', async () => {
    const { CLICK_EVENTS, trackClick } = await importAnalytics()

    trackClick(CLICK_EVENTS.HAIRCUT_EXPAND_CLICK, {
      featureArea: 'haircut_tracker',
      pageView: 'home',
    })

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())

    expect(fetch.mock.calls[0][1].keepalive).toBe(true)
  })
})
