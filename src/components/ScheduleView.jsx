import { ArrowLeft, CalendarDays } from 'lucide-react'
import { MatchCard } from './MatchCard'

export function ScheduleView({ matches, onBack }) {
  const sortedMatches = [...matches].sort((first, second) => {
    const firstTime = new Date(first.kickoffAt ?? `${first.date}T00:00:00Z`).getTime()
    const secondTime = new Date(second.kickoffAt ?? `${second.date}T00:00:00Z`).getTime()

    return firstTime - secondTime
  })

  const matchesByDate = sortedMatches.reduce((dates, match) => {
    dates[match.date] = dates[match.date] ? [...dates[match.date], match] : [match]
    return dates
  }, {})

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Match hub
      </button>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-burnt_peach-300">Real schedule</p>
          <h1 className="mt-2 text-4xl font-black text-twilight_indigo">Full World Cup 2026 schedule</h1>
        </div>
        <p className="rounded bg-muted_teal-900 px-3 py-2 text-sm font-black text-muted_teal-300">
          {matches.length} fixtures
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-lg border border-twilight_indigo-900 bg-white p-6 text-sm font-bold text-twilight_indigo-600 shadow-panel">
          Fixtures will appear here once Supabase has schedule rows.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <section key={date} aria-labelledby={`schedule-${date}`}>
              <h2
                id={`schedule-${date}`}
                className="sticky top-0 z-10 flex items-center gap-2 border-y border-twilight_indigo-900 bg-eggshell py-3 text-xl font-black"
              >
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-muted_teal-300" />
                {formatDate(date)}
              </h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {dateMatches.map((match) => (
                  <div key={match.id}>
                    <MatchCard match={match} expandable />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
