import { ChevronDown, Clock, MapPin } from 'lucide-react'
import { useId, useState } from 'react'
import { FixtureInsights } from './FixtureInsights'

export function MatchCard({ match, expandable = false, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const panelId = useId()
  const isLive = match.status === 'Live'
  const isExpanded = expandable && expanded
  const Summary = expandable ? 'button' : 'div'
  const summaryProps = expandable
    ? {
        type: 'button',
        'aria-expanded': expanded,
        'aria-controls': panelId,
        onClick: () => setExpanded((current) => !current),
      }
    : {}

  return (
    <article className="rounded-lg border border-twilight_indigo-900 bg-white shadow-panel">
      <Summary
        className={`flex w-full items-center justify-between gap-3 rounded-lg p-4 text-left ${
          expandable
            ? 'transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach focus:ring-offset-2'
            : ''
        }`}
        {...summaryProps}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase text-twilight_indigo-600">
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
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <TeamBlock team={match.home} align="left" />
            <div className="rounded bg-twilight_indigo px-3 py-2 text-center text-lg font-black text-eggshell">
              {isLive ? `${match.score.home} - ${match.score.away}` : 'vs'}
            </div>
            <TeamBlock team={match.away} align="right" />
          </div>
        </div>
        {expandable ? (
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-twilight_indigo transition ${expanded ? 'rotate-180' : ''}`}
          />
        ) : null}
      </Summary>
      {isExpanded ? (
        <div id={panelId} className="border-t border-twilight_indigo-900 px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-4 text-sm text-twilight_indigo-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="h-4 w-4" />
              {isLive ? `${match.minute}'` : `${match.date} / ${match.time}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {match.ground}
            </span>
          </div>
          <FixtureInsights insights={match.insights} />
        </div>
      ) : null}
    </article>
  )
}

function TeamBlock({ team, align }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="break-words text-base font-black leading-tight text-twilight_indigo sm:text-lg">
        <span aria-hidden="true">{team.flag}</span> {team.name}
      </p>
      <p className="text-xs font-bold uppercase text-muted_teal-300">{team.code}</p>
    </div>
  )
}

function formatCardDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}
