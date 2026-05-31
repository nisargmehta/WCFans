import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'

export function ScheduleView({ matches, onBack }) {
  const matchesByDate = matches.reduce((dates, match) => {
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
                <article key={match.id} className="rounded-lg bg-white p-4 shadow-panel ring-1 ring-twilight_indigo-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase text-twilight_indigo-600">
                      {match.group} / {match.round}
                    </p>
                    <p className="text-sm font-bold text-burnt_peach-300">{match.time}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <Team team={match.home} />
                    <span className="rounded bg-twilight_indigo px-3 py-2 text-sm font-black text-eggshell">vs</span>
                    <Team team={match.away} align="right" />
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-twilight_indigo-600">
                    <MapPin aria-hidden="true" className="h-4 w-4" />
                    {match.ground}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function Team({ team, align }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="truncate text-base font-black">
        <span aria-hidden="true">{team.flag}</span> {team.name}
      </p>
      <p className="text-xs font-black uppercase text-muted_teal-300">{team.code}</p>
    </div>
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
