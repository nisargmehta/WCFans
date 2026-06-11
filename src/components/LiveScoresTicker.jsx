import { Radio } from 'lucide-react'
import { CLICK_EVENTS, trackClick } from '../client/analytics'
import { hasMatchFeedData, hasPublishedLineups } from '../server/matchDetails'

export function LiveScoresTicker({ matches, onMatchSelect }) {
  const visibleMatches = matches.slice(0, 4)

  if (visibleMatches.length === 0) {
    return (
      <section className="border-b border-twilight_indigo-900 bg-white text-twilight_indigo dark:border-white/10 dark:bg-twilight_indigo-200 dark:text-eggshell-800" aria-label="Live scores">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-twilight_indigo-600 dark:text-eggshell-600">No live matches right now.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="border-b border-twilight_indigo-900 bg-eggshell-800 text-twilight_indigo dark:border-white/10 dark:bg-twilight_indigo-200 dark:text-eggshell-800"
      aria-label="Live scores ticker"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-burnt_peach-300 dark:text-burnt_peach-600">
          <Radio aria-hidden="true" className="h-3.5 w-3.5" />
          {visibleMatches.some((match) => match.status === 'Live') ? 'Live scores' : 'Match details'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleMatches.map((match) => (
            <LiveScoreCard key={match.id} match={match} onMatchSelect={onMatchSelect} />
          ))}
        </div>
      </div>
    </section>
  )
}

function LiveScoreCard({ match, onMatchSelect }) {
  return (
    <article className="rounded-lg border border-twilight_indigo-900 bg-white shadow-panel dark:border-white/10 dark:bg-twilight_indigo-300">
      <button
        type="button"
        className="w-full rounded-lg p-3 text-left transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach focus:ring-offset-2 dark:hover:bg-twilight_indigo-400 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
        onClick={() => {
          trackClick(CLICK_EVENTS.LIVE_SCORE_CARD_CLICK, {
            featureArea: 'live_scores',
            pageView: 'home',
            targetId: match.id,
            targetLabel: getMatchLabel(match),
            metadata: {
              matchStatus: match.status,
              minute: match.minute,
              hasFeedData: hasMatchFeedData(match),
            },
          })
          onMatchSelect?.(match)
        }}
      >
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-twilight_indigo-600 dark:text-eggshell-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-burnt_peach" aria-hidden="true" />
            {formatCardBadge(match)}
          </span>
          <span className="truncate normal-case tracking-normal">{match.group ?? match.round}</span>
        </div>
        <div className="mt-3 space-y-2">
          <ScoreRow team={match.home} score={match.score.home} />
          <ScoreRow team={match.away} score={match.score.away} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-twilight_indigo-900 pt-2 text-xs font-bold text-twilight_indigo-600 dark:border-white/10 dark:text-eggshell-600">
          <span>{formatLiveStatus(match)}</span>
          <span className="text-burnt_peach-300 dark:text-burnt_peach-600">Details</span>
        </div>
      </button>
    </article>
  )
}

function getMatchLabel(match) {
  return `${match.home.name ?? match.home.code} vs ${match.away.name ?? match.away.code}`
}

function ScoreRow({ team, score }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <span className="truncate text-base font-black leading-tight text-twilight_indigo dark:text-eggshell-800">
        <span aria-hidden="true">{team.flag}</span> {team.name ?? team.code}
      </span>
      <span className="text-xl font-black leading-none text-twilight_indigo dark:text-eggshell-800">{score ?? '-'}</span>
    </div>
  )
}

function formatLiveStatus(match) {
  if (match.status === 'Scheduled' && hasPublishedLineups(match)) {
    return 'Lineups posted'
  }

  if (match.status === 'Scheduled' && hasMatchFeedData(match)) {
    return 'Match feed available'
  }

  if (typeof match.minute === 'number') {
    return `${match.minute}'`
  }

  return 'In progress'
}

function formatCardBadge(match) {
  if (match.status === 'Scheduled' && hasPublishedLineups(match)) {
    return 'Lineups'
  }

  if (match.status === 'Scheduled' && hasMatchFeedData(match)) {
    return 'Details'
  }

  return 'Live'
}
