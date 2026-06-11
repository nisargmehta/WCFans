import { CalendarDays, ChevronDown, Moon, Sun, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CLICK_EVENTS, trackAppLaunch, trackClick } from './client/analytics'
import { fetchDashboardData } from './client/api'
import { HaircutTracker } from './components/HaircutTracker'
import { LiveScoresTicker } from './components/LiveScoresTicker'
import { MatchCard } from './components/MatchCard'
import { MatchDetailsView } from './components/MatchDetailsView'
import { NewsFeed } from './components/NewsFeed'
import { ScheduleView } from './components/ScheduleView'
import { StandingsView } from './components/StandingsView'

const DASHBOARD_LIVE_POLL_MS = 30 * 1000

function App() {
  const [dashboard, setDashboard] = useState(null)
  const [view, setView] = useState('home')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matchBackView, setMatchBackView] = useState('home')
  const [matchesExpanded, setMatchesExpanded] = useState(false)
  const [storiesExpanded, setStoriesExpanded] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => getInitialDarkMode())

  useEffect(() => {
    trackAppLaunch()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('wcfans-theme', isDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDarkMode)
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light'
  }, [isDarkMode])

  const openMatch = (match, backView) => {
    setSelectedMatch(match)
    setMatchBackView(backView)
    setView('match')
  }

  const toggleTheme = () => {
    trackClick(CLICK_EVENTS.THEME_TOGGLE_CLICK, {
      featureArea: 'theme',
      pageView: view,
      metadata: {
        nextTheme: isDarkMode ? 'light' : 'dark',
      },
    })
    setIsDarkMode((current) => !current)
  }

  useEffect(() => {
    let active = true
    let pollTimeout = null

    const refreshDashboard = async () => {
      const data = await fetchDashboardData()
      if (active) {
        setDashboard(data)

        if (data.liveMatches.length > 0) {
          pollTimeout = window.setTimeout(refreshDashboard, DASHBOARD_LIVE_POLL_MS)
        }
      }
    }

    refreshDashboard()

    return () => {
      active = false
      window.clearTimeout(pollTimeout)
    }
  }, [])

  useEffect(() => {
    if (!dashboard || !selectedMatch) {
      return
    }

    const refreshedMatch = dashboard.scheduleMatches.find((match) => match.id === selectedMatch.id)
    if (refreshedMatch && refreshedMatch !== selectedMatch) {
      setSelectedMatch(refreshedMatch)
    }
  }, [dashboard, selectedMatch])

  if (!dashboard) {
    return (
      <main
        className={`${isDarkMode ? 'dark ' : ''}grid min-h-screen place-items-center bg-eggshell px-4 text-twilight_indigo transition-colors dark:bg-[#090b12] dark:text-eggshell-800`}
      >
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-burnt_peach-300 dark:text-burnt_peach-600 sm:text-sm">WCFans</p>
          <h1 className="mt-2 text-2xl font-black">Loading the match hub</h1>
        </div>
      </main>
    )
  }

  if (view === 'schedule') {
    return (
      <div
        className={`${isDarkMode ? 'dark ' : ''}min-h-screen bg-eggshell text-twilight_indigo transition-colors dark:bg-[#090b12] dark:text-eggshell-800`}
      >
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        <ScheduleView
          matches={dashboard.scheduleMatches}
          onBack={() => setView('home')}
          onMatchSelect={(match) => openMatch(match, 'schedule')}
        />
      </div>
    )
  }

  if (view === 'match' && selectedMatch) {
    return (
      <div
        className={`${isDarkMode ? 'dark ' : ''}min-h-screen bg-eggshell text-twilight_indigo transition-colors dark:bg-[#090b12] dark:text-eggshell-800`}
      >
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        <MatchDetailsView
          match={selectedMatch}
          onBack={() => setView(matchBackView)}
          backLabel={matchBackView === 'schedule' ? 'Full schedule' : 'Match hub'}
        />
      </div>
    )
  }

  if (view === 'standings') {
    return (
      <div
        className={`${isDarkMode ? 'dark ' : ''}min-h-screen bg-eggshell text-twilight_indigo transition-colors dark:bg-[#090b12] dark:text-eggshell-800`}
      >
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        <StandingsView standings={dashboard.standings} onBack={() => setView('home')} />
      </div>
    )
  }

  const visibleMatches = matchesExpanded ? dashboard.upcomingMatches : dashboard.upcomingMatches.slice(0, 4)
  const visibleStories = storiesExpanded ? dashboard.news.slice(0, 30) : dashboard.news.slice(0, 8)

  return (
    <div
      className={`${isDarkMode ? 'dark ' : ''}min-h-screen bg-eggshell text-twilight_indigo transition-colors dark:bg-[#090b12] dark:text-eggshell-800`}
    >
      <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
      <header className="border-b border-twilight_indigo-900 bg-eggshell-900 transition-colors dark:border-white/10 dark:bg-twilight_indigo-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-burnt_peach-300 dark:text-burnt_peach-600 sm:text-sm">FIFA World Cup 2026</p>
            <h1 className="mt-1 max-w-3xl text-2xl font-black leading-tight text-twilight_indigo dark:text-eggshell-800 sm:mt-2 sm:text-2xl">
              News, scores & fan rituals.
            </h1>
          </div>
        </div>
      </header>

      <LiveScoresTicker matches={dashboard.liveMatches} onMatchSelect={(match) => openMatch(match, 'home')} />

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-5 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
        <HaircutTracker teams={dashboard.haircutTracker} />

        <section aria-labelledby="matches-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle id="matches-heading" eyebrow="Match center" title="Live and upcoming fixtures" />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  trackClick(CLICK_EVENTS.STANDINGS_OPEN_CLICK, {
                    featureArea: 'match_center',
                    pageView: 'home',
                  })
                  setView('standings')
                }}
                className="inline-flex h-11 items-center gap-2 rounded bg-white px-4 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-300 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
              >
                <Trophy aria-hidden="true" className="h-4 w-4" />
                Standings
              </button>
              <button
                type="button"
                onClick={() => {
                  trackClick(CLICK_EVENTS.SCHEDULE_OPEN_CLICK, {
                    featureArea: 'match_center',
                    pageView: 'home',
                  })
                  setView('schedule')
                }}
                className="inline-flex h-11 items-center gap-2 rounded bg-white px-4 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-300 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Full schedule
              </button>
            </div>
          </div>
          <div className="mt-4 columns-1 gap-4 lg:columns-2">
            {visibleMatches.length > 0 ? (
              visibleMatches.map((match) => (
                <div key={match.id} className="mb-4 break-inside-avoid">
                  <MatchCard match={match} />
                </div>
              ))
            ) : (
              <div className="mb-4 break-inside-avoid rounded-lg border border-twilight_indigo-900 bg-white p-6 text-sm font-bold text-twilight_indigo-600 shadow-panel dark:border-white/10 dark:bg-twilight_indigo-200 dark:text-eggshell-600">
                Fixtures will appear here once Supabase has schedule rows.
              </div>
            )}
          </div>
          {dashboard.upcomingMatches.length > 4 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  trackClick(CLICK_EVENTS.MATCHES_EXPAND_CLICK, {
                    featureArea: 'match_center',
                    pageView: 'home',
                    metadata: {
                      expandedTo: !matchesExpanded,
                    },
                  })
                  setMatchesExpanded((current) => !current)
                }}
                className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-300 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
                aria-expanded={matchesExpanded}
              >
                {matchesExpanded ? 'Show fewer matches' : 'Show more matches'}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 transition ${matchesExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="news-heading">
          <SectionTitle id="news-heading" eyebrow="News feed" title="World Cup stories" />
          <div className="mt-4">
            <NewsFeed articles={visibleStories} />
          </div>
          {dashboard.news.length > 8 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  trackClick(CLICK_EVENTS.NEWS_EXPAND_CLICK, {
                    featureArea: 'news_feed',
                    pageView: 'home',
                    metadata: {
                      expandedTo: !storiesExpanded,
                    },
                  })
                  setStoriesExpanded((current) => !current)
                }}
                className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-300 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
                aria-expanded={storiesExpanded}
              >
                {storiesExpanded ? 'Show fewer stories' : `See more stories (${Math.min(dashboard.news.length, 30)})`}
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${storiesExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

function SectionTitle({ id, eyebrow, title }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-burnt_peach-300 dark:text-burnt_peach-600 sm:text-sm">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-2xl font-black text-twilight_indigo dark:text-eggshell-800">
        {title}
      </h2>
    </div>
  )
}

function ThemeToggle({ isDarkMode, onToggle }) {
  const Icon = isDarkMode ? Sun : Moon
  const label = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed right-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded bg-white text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-300 dark:text-eggshell-800 dark:ring-white/15 dark:hover:bg-twilight_indigo-400 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
      aria-label={label}
      title={label}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  )
}

function getInitialDarkMode() {
  const storedTheme = window.localStorage.getItem('wcfans-theme')

  if (storedTheme === 'dark') {
    return true
  }

  if (storedTheme === 'light') {
    return false
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export default App
