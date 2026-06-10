import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { MatchDetails } from './MatchDetails'

export function MatchDetailsView({ match, onBack, backLabel = 'Match hub' }) {
  const isLive = match.status === 'Live'

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-300 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {backLabel}
      </button>

      <section className="mt-5 rounded-lg border border-twilight_indigo-900 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-twilight_indigo-200 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-black uppercase text-twilight_indigo-600 dark:text-eggshell-600">
          <span>{match.group} / {match.round}</span>
          <span className={isLive ? 'text-burnt_peach-300 dark:text-burnt_peach-600' : 'text-muted_teal-300 dark:text-muted_teal-600'}>{match.status}</span>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <TeamHeading team={match.home} />
          <div className="rounded bg-twilight_indigo px-3 py-2 text-center text-xl font-black text-eggshell dark:bg-burnt_peach-500 dark:text-twilight_indigo-100">
            {formatScore(match)}
          </div>
          <TeamHeading team={match.away} align="right" />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-twilight_indigo-900 pt-3 text-sm font-semibold text-twilight_indigo-600 dark:border-white/10 dark:text-eggshell-600">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-4 w-4" />
            {isLive && typeof match.minute === 'number' ? `${match.minute}'` : `${formatMatchDate(match)} / ${match.time}`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {match.ground}
          </span>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-twilight_indigo-900 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-twilight_indigo-200 sm:p-5">
        <MatchDetails match={match} />
      </section>
      <p className="mt-4 rounded bg-white px-3 py-2 text-sm font-bold text-twilight_indigo-600 shadow-panel ring-1 ring-twilight_indigo-900 dark:bg-twilight_indigo-200 dark:text-eggshell-600 dark:ring-white/10">
        Lineups, events, stats, and final data update after the match feed is available/final.
      </p>
    </main>
  )
}

function TeamHeading({ team, align = 'left' }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <h2 className="break-words text-xl font-black leading-tight text-twilight_indigo dark:text-eggshell-800 sm:text-2xl">
        <span aria-hidden="true">{team.flag}</span> {team.name}
      </h2>
      <p className="text-xs font-bold uppercase text-muted_teal-300 dark:text-muted_teal-600">{team.code}</p>
    </div>
  )
}

function formatScore(match) {
  if (typeof match.score?.home !== 'number' || typeof match.score?.away !== 'number') {
    return 'vs'
  }

  return `${match.score.home} - ${match.score.away}`
}

function formatMatchDate(match) {
  const date = match.kickoffAt ? new Date(match.kickoffAt) : new Date(`${match.date}T12:00:00Z`)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}
