import { ArrowDownLeft, ArrowUpRight, ChevronDown, Circle } from 'lucide-react'
import { useState } from 'react'

const STAT_KEYS = [
  'ball_possession',
  'shots',
  'shots_on_goal',
  'shots_off_goal',
  'corner_kicks',
  'offsides',
  'fouls',
  'saves',
  'yellow_cards',
  'red_cards',
]

export function MatchDetails({ match }) {
  const [lineupsExpanded, setLineupsExpanded] = useState(false)
  const details = match.details ?? {}
  const hasLineups = hasItems(details.homeLineup) || hasItems(details.awayLineup)
  const statRows = getStatRows(details.homeStatistics, details.awayStatistics)
  const timelineEvents = getTimelineEvents(match)
  const lineupsContentId = `${match.id}-lineups-content`

  return (
    <div className="space-y-5">
      <section aria-labelledby={`${match.id}-stats-heading`}>
        <h3 id={`${match.id}-stats-heading`} className="text-lg font-black text-twilight_indigo dark:text-eggshell-800">
          Stats
        </h3>
        {statRows.length > 0 ? (
          <div className="mt-2 space-y-2">
            {statRows.map((stat) => (
              <div key={stat.key} className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                <span className="text-right font-black text-twilight_indigo dark:text-eggshell-800">{formatStatValue(stat.home, stat.key)}</span>
                <div>
                  <p className="text-center text-xs font-bold uppercase text-twilight_indigo-600 dark:text-eggshell-600">{stat.label}</p>
                  <div className="mt-1 grid h-1.5 grid-cols-2 overflow-hidden rounded bg-eggshell-800 dark:bg-twilight_indigo-300">
                    <div className="bg-muted_teal" style={{ width: `${stat.homeShare}%`, justifySelf: 'end' }} />
                    <div className="bg-burnt_peach" style={{ width: `${stat.awayShare}%` }} />
                  </div>
                </div>
                <span className="font-black text-twilight_indigo dark:text-eggshell-800">{formatStatValue(stat.away, stat.key)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded bg-eggshell-800 px-3 py-2 text-sm font-semibold text-twilight_indigo-600 dark:bg-twilight_indigo-300 dark:text-eggshell-600">
            Stats will appear once the match feed updates.
          </p>
        )}
      </section>

      <section aria-labelledby={`${match.id}-timeline-heading`}>
        <h3 id={`${match.id}-timeline-heading`} className="text-lg font-black text-twilight_indigo dark:text-eggshell-800">
          Timeline
        </h3>
        {timelineEvents.length > 0 ? (
          <Timeline events={timelineEvents} />
        ) : (
          <p className="mt-2 rounded bg-eggshell-800 px-3 py-2 text-sm font-semibold text-twilight_indigo-600 dark:bg-twilight_indigo-300 dark:text-eggshell-600">
            Match events will appear once Football-Data publishes goals, cards, and substitutions.
          </p>
        )}
      </section>

      <section aria-labelledby={`${match.id}-lineups-heading`}>
        <div className="flex items-center justify-between gap-3">
          <h3 id={`${match.id}-lineups-heading`} className="text-lg font-black text-twilight_indigo dark:text-eggshell-800">
            Lineups
          </h3>
          {hasLineups ? (
            <button
              type="button"
              onClick={() => setLineupsExpanded((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-twilight_indigo-900 bg-white text-twilight_indigo transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach dark:border-white/10 dark:bg-twilight_indigo-300 dark:text-eggshell-800 dark:hover:bg-twilight_indigo-400 dark:focus:ring-burnt_peach-600"
              aria-controls={lineupsContentId}
              aria-expanded={lineupsExpanded}
              aria-label={lineupsExpanded ? 'Collapse lineups' : 'Expand lineups'}
            >
              <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${lineupsExpanded ? 'rotate-180' : ''}`} />
            </button>
          ) : null}
        </div>
        {!hasLineups ? (
          <p className="mt-2 rounded bg-eggshell-800 px-3 py-2 text-sm font-semibold text-twilight_indigo-600 dark:bg-twilight_indigo-300 dark:text-eggshell-600">
            Lineups will appear after Football-Data publishes match details.
          </p>
        ) : null}
        {hasLineups && lineupsExpanded ? (
          <div id={lineupsContentId} className="mt-2 grid gap-3 md:grid-cols-2">
            <TeamSheet
              team={match.home}
              formation={details.homeFormation}
              lineup={details.homeLineup}
              bench={details.homeBench}
            />
            <TeamSheet
              team={match.away}
              formation={details.awayFormation}
              lineup={details.awayLineup}
              bench={details.awayBench}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Timeline({ events }) {
  return (
    <ol className="relative mt-3 overflow-hidden rounded-lg bg-twilight_indigo px-3 py-4 text-eggshell shadow-inner dark:bg-twilight_indigo-300 dark:text-eggshell-800 sm:px-4">
      <span aria-hidden="true" className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-white/15" />
      {events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </ol>
  )
}

function TimelineItem({ event }) {
  if (event.kind === 'half-time') {
    return (
      <li className="relative grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 py-4">
        <span className="h-px bg-white/15" aria-hidden="true" />
        <span className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white/40 bg-twilight_indigo text-sm font-black dark:bg-twilight_indigo-300">
          HT
        </span>
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
          <span className="text-lg font-black">{event.score}</span>
        </div>
      </li>
    )
  }

  const isAway = event.side === 'away'
  const content = <TimelineEventText event={event} align={isAway ? 'left' : 'right'} />

  return (
    <li className="relative grid min-h-20 grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 py-2">
      <div className={`min-w-0 ${isAway ? 'col-start-3' : 'col-start-1'}`}>
        <div className={`flex items-start gap-3 ${isAway ? 'justify-start text-left' : 'justify-end text-right'}`}>
          {isAway ? <TimelineMinute minute={event.minute} /> : content}
          {isAway ? content : <TimelineMinute minute={event.minute} />}
        </div>
      </div>
      <div className="z-10 col-start-2 row-start-1 flex justify-center">
        <TimelineIcon event={event} />
      </div>
    </li>
  )
}

function TimelineMinute({ minute }) {
  return <span className="shrink-0 pt-1 text-base font-black text-eggshell dark:text-eggshell-800 sm:text-lg">{minute}</span>
}

function TimelineEventText({ event, align }) {
  const alignClass = align === 'right' ? 'items-end text-right' : 'items-start text-left'

  if (event.kind === 'substitution') {
    return (
      <div className={`flex min-w-0 flex-col ${alignClass}`}>
        <span className="truncate text-base font-black text-emerald-400 sm:text-lg">{event.playerIn}</span>
        <span className="truncate text-base font-black text-red-400 sm:text-lg">{event.playerOut}</span>
      </div>
    )
  }

  return (
    <div className={`flex min-w-0 flex-col ${alignClass}`}>
      <p className="max-w-full truncate text-base font-black text-eggshell dark:text-eggshell-800 sm:text-lg">
        {event.title}
        {event.score ? <span className="text-emerald-400"> ({event.score})</span> : null}
      </p>
      {event.detail ? <p className="max-w-full truncate text-sm font-semibold text-white/55 dark:text-eggshell-600 sm:text-base">{event.detail}</p> : null}
    </div>
  )
}

function TimelineIcon({ event }) {
  if (event.kind === 'booking') {
    const cardColor = event.card === 'red' ? 'bg-red-500' : 'bg-yellow-300'
    return <span className={`h-8 w-6 rounded ${cardColor} shadow-sm`} aria-hidden="true" />
  }

  if (event.kind === 'substitution') {
    return (
      <span className="flex flex-col gap-1" aria-hidden="true">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-400 text-white">
          <ArrowDownLeft className="h-4 w-4" />
        </span>
      </span>
    )
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-eggshell ring-1 ring-white/20 dark:text-eggshell-800" aria-hidden="true">
      <Circle className="h-5 w-5 fill-eggshell stroke-eggshell dark:fill-eggshell-800 dark:stroke-eggshell-800" />
    </span>
  )
}

function TeamSheet({ team, formation, lineup = [], bench = [] }) {
  return (
    <div className="rounded border border-twilight_indigo-900 bg-eggshell-900 p-3 dark:border-white/10 dark:bg-twilight_indigo-300">
      <div className="flex items-center justify-between gap-3">
        <h5 className="truncate text-sm font-black text-twilight_indigo dark:text-eggshell-800">
          <span aria-hidden="true">{team.flag}</span> {team.name}
        </h5>
        {formation ? <span className="rounded bg-white px-2 py-1 text-xs font-black text-twilight_indigo dark:bg-twilight_indigo-100 dark:text-eggshell-800">{formation}</span> : null}
      </div>
      <ol className="mt-3 space-y-1 text-sm text-twilight_indigo dark:text-eggshell-800">
        {lineup.map((player) => (
          <li key={player.id ?? player.name} className="flex items-center justify-between gap-3">
            <span className="truncate font-semibold">{player.name}</span>
            <span className="shrink-0 text-xs font-bold text-twilight_indigo-600 dark:text-eggshell-600">{player.position ?? player.shirtNumber ?? ''}</span>
          </li>
        ))}
      </ol>
      {bench.length > 0 ? (
        <p className="mt-3 text-xs font-bold text-twilight_indigo-600 dark:text-eggshell-600">
          Bench: {bench.slice(0, 5).map((player) => player.name).join(', ')}
          {bench.length > 5 ? '...' : ''}
        </p>
      ) : null}
    </div>
  )
}

function getTimelineEvents(match) {
  const details = match.details ?? {}
  const events = [
    ...(details.goals ?? []).map((goal, index) => ({
      id: `goal-${goal.minute}-${goal.scorer?.id ?? index}`,
      kind: 'goal',
      side: getEventSide(goal.team?.name, match),
      minute: formatEventMinute(goal.minute, goal.injuryTime),
      sortMinute: getSortMinute(goal.minute, goal.injuryTime),
      title: goal.scorer?.name ?? (goal.type === 'PENALTY' ? 'Penalty goal' : 'Goal'),
      detail: goal.assist?.name ? `Assist by ${goal.assist.name}` : null,
      score: formatScore(goal.score),
    })),
    ...(details.bookings ?? []).map((booking, index) => ({
      id: `booking-${booking.minute}-${booking.player?.id ?? index}`,
      kind: 'booking',
      side: getEventSide(booking.team?.name, match),
      minute: formatEventMinute(booking.minute),
      sortMinute: getSortMinute(booking.minute),
      title: booking.player?.name ?? 'Player',
      detail: `${formatCard(booking.card)} card`,
      card: isRedCard(booking.card) ? 'red' : 'yellow',
    })),
    ...(details.substitutions ?? []).map((substitution, index) => ({
      id: `sub-${substitution.minute}-${substitution.playerIn?.id ?? index}`,
      kind: 'substitution',
      side: getEventSide(substitution.team?.name, match),
      minute: formatEventMinute(substitution.minute),
      sortMinute: getSortMinute(substitution.minute),
      playerIn: substitution.playerIn?.name ?? 'Player in',
      playerOut: substitution.playerOut?.name ?? 'Player out',
    })),
    ...(details.penalties ?? []).map((penalty, index) => ({
      id: `penalty-${penalty.player?.id ?? index}`,
      kind: 'penalty',
      side: getEventSide(penalty.team?.name, match),
      minute: 'PEN',
      sortMinute: 130 + index,
      title: penalty.player?.name ?? 'Player',
      detail: penalty.scored ? 'Penalty scored' : 'Penalty missed',
    })),
  ]

  const halfTimeScore = getHalfTimeScore(details.score)
  if (halfTimeScore) {
    events.push({
      id: 'half-time',
      kind: 'half-time',
      score: halfTimeScore,
      sortMinute: 45.5,
    })
  }

  return events.sort((first, second) => first.sortMinute - second.sortMinute)
}

function getEventSide(teamName, match) {
  if (normalizeName(teamName) === normalizeName(match.away?.name)) {
    return 'away'
  }

  return 'home'
}

function getHalfTimeScore(score = {}) {
  const home = score.halfTime?.home
  const away = score.halfTime?.away

  return typeof home === 'number' && typeof away === 'number' ? `${home} - ${away}` : null
}

function formatEventMinute(minute, injuryTime = null) {
  if (typeof minute !== 'number') {
    return '-'
  }

  return injuryTime ? `${minute}+${injuryTime}'` : `${minute}'`
}

function getSortMinute(minute, injuryTime = null) {
  return (typeof minute === 'number' ? minute : 0) + (typeof injuryTime === 'number' ? injuryTime / 100 : 0)
}

function formatCard(card) {
  if (!card) {
    return 'Card'
  }

  return card.toLowerCase().replaceAll('_', ' ')
}

function isRedCard(card) {
  return typeof card === 'string' && card.toLowerCase().includes('red')
}

function formatScore(score) {
  if (!score || typeof score.home !== 'number' || typeof score.away !== 'number') {
    return null
  }

  return `${score.home} - ${score.away}`
}

function normalizeName(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : ''
}

function getStatRows(homeStatistics = {}, awayStatistics = {}) {
  return STAT_KEYS.map((key) => {
    const home = toNumber(homeStatistics?.[key])
    const away = toNumber(awayStatistics?.[key])

    if (home === null && away === null) {
      return null
    }

    const homeValue = home ?? 0
    const awayValue = away ?? 0
    const total = homeValue + awayValue
    const homeShare = total > 0 ? (homeValue / total) * 100 : 50
    const awayShare = total > 0 ? (awayValue / total) * 100 : 50

    return {
      key,
      label: formatStatLabel(key),
      home: homeValue,
      away: awayValue,
      homeShare,
      awayShare,
    }
  }).filter(Boolean)
}

function hasItems(items) {
  return Array.isArray(items) && items.length > 0
}

function toNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

function formatStatLabel(key) {
  return key.replaceAll('_', ' ')
}

function formatStatValue(value, key) {
  return key === 'ball_possession' ? `${value}%` : value
}
