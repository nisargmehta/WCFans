import { ChevronDown, Clock, MapPin } from 'lucide-react'
import { useId, useState } from 'react'
import { FixtureInsights } from './FixtureInsights'

export function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(match.status === 'Live')
  const panelId = useId()
  const isLive = match.status === 'Live'

  return (
    <article className="rounded-lg border border-twilight_indigo-900 bg-white shadow-panel">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-lg p-4 text-left transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach focus:ring-offset-2"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-twilight_indigo-600">
            <span>{match.group}</span>
            <span aria-hidden="true">/</span>
            <span>{match.round}</span>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamBlock team={match.home} align="left" />
            <div className="rounded bg-twilight_indigo px-3 py-2 text-center text-lg font-black text-eggshell">
              {isLive ? `${match.score.home} - ${match.score.away}` : 'vs'}
            </div>
            <TeamBlock team={match.away} align="right" />
          </div>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-twilight_indigo transition ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded ? (
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
      <p className="truncate text-lg font-black text-twilight_indigo">
        <span aria-hidden="true">{team.flag}</span> {team.name}
      </p>
      <p className="text-xs font-bold uppercase text-muted_teal-300">{team.code}</p>
    </div>
  )
}
