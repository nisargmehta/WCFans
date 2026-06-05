import { CalendarDays, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchDashboardData } from './client/api'
import { HaircutTracker } from './components/HaircutTracker'
import { LiveScoresTicker } from './components/LiveScoresTicker'
import { MatchCard } from './components/MatchCard'
import { NewsFeed } from './components/NewsFeed'
import { ScheduleView } from './components/ScheduleView'

function App() {
  const [dashboard, setDashboard] = useState(null)
  const [view, setView] = useState('home')
  const [matchesExpanded, setMatchesExpanded] = useState(false)

  useEffect(() => {
    let active = true

    fetchDashboardData().then((data) => {
      if (active) {
        setDashboard(data)
      }
    })

    return () => {
      active = false
    }
  }, [])

  if (!dashboard) {
    return (
      <main className="grid min-h-screen place-items-center bg-eggshell px-4 text-twilight_indigo">
        <div className="text-center">
          <p className="text-sm font-bold uppercase text-burnt_peach-300">WCFans</p>
          <h1 className="mt-2 text-3xl font-black">Loading the match hub</h1>
        </div>
      </main>
    )
  }

  if (view === 'schedule') {
    return (
      <div className="min-h-screen bg-eggshell text-twilight_indigo">
        <ScheduleView matches={dashboard.scheduleMatches} onBack={() => setView('home')} />
      </div>
    )
  }

  const visibleMatches = matchesExpanded ? dashboard.upcomingMatches : dashboard.upcomingMatches.slice(0, 4)

  return (
    <div className="min-h-screen bg-eggshell text-twilight_indigo">
      <header className="border-b border-twilight_indigo-900 bg-eggshell-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-burnt_peach-300">FIFA World Cup 2026</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-twilight_indigo sm:text-4xl">
              News, live scores, and fan rituals.
            </h1>
          </div>
        </div>
      </header>

      <LiveScoresTicker matches={dashboard.liveMatches} />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <HaircutTracker teams={dashboard.haircutTracker} />

        <section aria-labelledby="matches-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle id="matches-heading" eyebrow="Match center" title="Live and upcoming fixtures" />
            <button
              type="button"
              onClick={() => setView('schedule')}
              className="inline-flex items-center gap-2 rounded bg-twilight_indigo px-4 py-2 text-sm font-black text-eggshell transition hover:bg-twilight_indigo-400 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2"
            >
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Full schedule
            </button>
          </div>
          <div className="mt-4 columns-1 gap-4 lg:columns-2">
            {visibleMatches.map((match) => (
              <div key={match.id} className="mb-4 break-inside-avoid">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setMatchesExpanded((current) => !current)}
              className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2"
              aria-expanded={matchesExpanded}
            >
              {matchesExpanded ? 'Show fewer matches' : 'Show more matches'}
              <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${matchesExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </section>

        <section aria-labelledby="news-heading">
          <SectionTitle id="news-heading" eyebrow="News feed" title="World Cup stories" />
          <div className="mt-4">
            <NewsFeed articles={dashboard.news} />
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionTitle({ id, eyebrow, title }) {
  return (
    <div>
      <p className="text-sm font-black uppercase text-burnt_peach-300">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-3xl font-black text-twilight_indigo">
        {title}
      </h2>
    </div>
  )
}

export default App
