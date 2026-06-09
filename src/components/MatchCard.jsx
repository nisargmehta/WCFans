import { Clock } from 'lucide-react'

export function MatchCard({ match, onMatchSelect }) {
  const hasScore = match.status === 'Live' || match.status === 'Final'
  const canOpenDetails = hasScore && onMatchSelect
  const Summary = canOpenDetails ? 'button' : 'div'
  const summaryProps = canOpenDetails
    ? {
        type: 'button',
        onClick: () => onMatchSelect(match),
      }
    : {}

  return (
    <article className="rounded-lg border border-twilight_indigo-900 bg-white shadow-panel">
      <Summary
        className={`flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left sm:p-4 ${
          canOpenDetails
            ? 'transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach focus:ring-offset-2'
            : ''
        }`}
        {...summaryProps}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] font-semibold uppercase text-twilight_indigo-600 sm:text-xs">
            <span className="inline-flex items-center gap-2">
              <span>{match.group}</span>
              <span aria-hidden="true">/</span>
              <span>{match.round}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-burnt_peach-300">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              {formatCardDate(match.date)} / {match.time}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:mt-3 sm:gap-3">
            <TeamBlock team={match.home} align="left" />
            <div className="rounded bg-twilight_indigo px-2 py-1.5 text-center text-sm font-black text-eggshell sm:px-3 sm:py-2 sm:text-lg">
              {hasScore ? formatScore(match.score) : 'vs'}
            </div>
            <TeamBlock team={match.away} align="right" />
          </div>
        </div>
        {canOpenDetails ? (
          <span className="shrink-0 text-xs font-black uppercase text-burnt_peach-300">Details</span>
        ) : null}
      </Summary>
    </article>
  )
}

function TeamBlock({ team, align }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="break-words text-sm font-black leading-tight text-twilight_indigo sm:text-lg">
        <span aria-hidden="true">{team.flag}</span> {team.name}
      </p>
      <p className="text-[0.7rem] font-bold uppercase text-muted_teal-300 sm:text-xs">{team.code}</p>
    </div>
  )
}

function formatScore(score) {
  if (typeof score.home !== 'number' || typeof score.away !== 'number') {
    return 'vs'
  }

  return `${score.home} - ${score.away}`
}

function formatCardDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
