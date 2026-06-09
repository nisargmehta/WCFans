import { Radio } from 'lucide-react'

export function LiveScoresTicker({ matches }) {
  const visibleMatches = matches.slice(0, 4)

  if (visibleMatches.length === 0) {
    return (
      <section className="border-b border-twilight_indigo-900 bg-white text-twilight_indigo" aria-label="Live scores">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-twilight_indigo-600">No live matches right now.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="border-b border-twilight_indigo-900 bg-eggshell-800 text-twilight_indigo"
      aria-label="Live scores ticker"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-burnt_peach-300">
          <Radio aria-hidden="true" className="h-3.5 w-3.5" />
          Live scores
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleMatches.map((match) => (
            <LiveScoreCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    </section>
  )
}

function LiveScoreCard({ match }) {
  return (
    <article className="rounded-lg border border-twilight_indigo-900 bg-white p-3 shadow-panel">
      <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-twilight_indigo-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-burnt_peach" aria-hidden="true" />
          Live
        </span>
        <span className="truncate normal-case tracking-normal">{match.group ?? match.round}</span>
      </div>
      <div className="mt-3 space-y-2">
        <ScoreRow team={match.home} score={match.score.home} />
        <ScoreRow team={match.away} score={match.score.away} />
      </div>
      <p className="mt-3 border-t border-twilight_indigo-900 pt-2 text-xs font-bold text-twilight_indigo-600">
        {formatLiveStatus(match)}
      </p>
    </article>
  )
}

function ScoreRow({ team, score }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <span className="truncate text-base font-black leading-tight text-twilight_indigo">
        <span aria-hidden="true">{team.flag}</span> {team.name ?? team.code}
      </span>
      <span className="text-xl font-black leading-none text-twilight_indigo">{score ?? 0}</span>
    </div>
  )
}

function formatLiveStatus(match) {
  if (typeof match.minute === 'number') {
    return `${match.minute}' played`
  }

  return 'In progress'
}
