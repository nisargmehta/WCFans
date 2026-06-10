const DEFAULT_SUPABASE_URL = 'https://qhkglztddsowhgjqskqz.supabase.co'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

const ANALYTICS_QUEUE_KEY = 'wcfans-analytics-queue'
const ANALYTICS_SESSION_KEY = 'wcfans-analytics-session'
const ANALYTICS_BATCH_SIZE = 20
const ANALYTICS_FLUSH_MS = 60 * 1000
const ANALYTICS_MAX_QUEUE_SIZE = 250

export const CLICK_EVENTS = Object.freeze({
  LIVE_SCORE_CARD_CLICK: 'live_score_card_click',
  STANDINGS_OPEN_CLICK: 'standings_open_click',
  SCHEDULE_OPEN_CLICK: 'schedule_open_click',
  MATCH_BACK_CLICK: 'match_back_click',
  HAIRCUT_EXPAND_CLICK: 'haircut_expand_click',
  HAIRCUT_SHARE_CLICK: 'haircut_share_click',
  FAN_DEFENSE_GENERATE_CLICK: 'fan_defense_generate_click',
  FAN_DEFENSE_REGENERATE_CLICK: 'fan_defense_regenerate_click',
  FAN_DEFENSE_SHARE_CLICK: 'fan_defense_share_click',
  MATCHES_EXPAND_CLICK: 'matches_expand_click',
  NEWS_EXPAND_CLICK: 'news_expand_click',
  THEME_TOGGLE_CLICK: 'theme_toggle_click',
  SCHEDULE_MATCH_CLICK: 'schedule_match_click',
})

const CLICK_EVENT_NAMES = new Set(Object.values(CLICK_EVENTS))
const isConfigured = Boolean(supabaseUrl && supabasePublishableKey)
let queue = null
let listenersStarted = false
let flushPromise = null

export function trackClick(eventName, payload = {}) {
  if (!CLICK_EVENT_NAMES.has(eventName) || !isBrowser()) {
    return
  }

  startAnalytics()

  const event = {
    event_type: 'click',
    event_name: eventName,
    feature_area: payload.featureArea ?? null,
    page_view: payload.pageView ?? null,
    target_id: payload.targetId == null ? null : String(payload.targetId),
    target_label: payload.targetLabel ?? null,
    metadata: payload.metadata ?? {},
    session_id: getSessionId(),
    url: window.location.href,
    referrer: document.referrer || null,
  }

  const nextQueue = [...getQueue(), event].slice(-ANALYTICS_MAX_QUEUE_SIZE)
  setQueue(nextQueue)

  if (nextQueue.length >= ANALYTICS_BATCH_SIZE) {
    void flushAnalytics()
  }
}

export async function flushAnalytics({ keepalive = false } = {}) {
  if (!isConfigured || !isBrowser()) {
    return false
  }

  if (flushPromise) {
    return flushPromise
  }

  const events = getQueue()
  if (events.length === 0) {
    return true
  }

  setQueue([])

  flushPromise = postEvents(events, keepalive)
    .then(() => true)
    .catch(() => {
      setQueue([...events, ...getQueue()].slice(-ANALYTICS_MAX_QUEUE_SIZE))
      return false
    })
    .finally(() => {
      flushPromise = null
    })

  return flushPromise
}

function startAnalytics() {
  if (!isConfigured || listenersStarted || !isBrowser()) {
    return
  }

  listenersStarted = true
  window.setInterval(() => {
    void flushAnalytics()
  }, ANALYTICS_FLUSH_MS)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushAnalytics({ keepalive: true })
    }
  })
}

async function postEvents(events, keepalive) {
  const response = await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
    method: 'POST',
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(events),
    keepalive,
  })

  if (!response.ok) {
    throw new Error('Analytics request failed')
  }
}

function getQueue() {
  if (queue) {
    return queue
  }

  queue = readStoredQueue()
  return queue
}

function setQueue(nextQueue) {
  queue = nextQueue
  writeStoredQueue(nextQueue)
}

function readStoredQueue() {
  try {
    const storedQueue = window.localStorage.getItem(ANALYTICS_QUEUE_KEY)
    const parsedQueue = storedQueue ? JSON.parse(storedQueue) : []
    return Array.isArray(parsedQueue) ? parsedQueue : []
  } catch {
    return []
  }
}

function writeStoredQueue(nextQueue) {
  try {
    window.localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(nextQueue))
  } catch {
    queue = nextQueue
  }
}

function getSessionId() {
  try {
    const storedSession = window.localStorage.getItem(ANALYTICS_SESSION_KEY)
    if (storedSession) {
      return storedSession
    }

    const sessionId = createSessionId()
    window.localStorage.setItem(ANALYTICS_SESSION_KEY, sessionId)
    return sessionId
  } catch {
    return createSessionId()
  }
}

function createSessionId() {
  return window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
