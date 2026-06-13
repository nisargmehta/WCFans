import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { CLICK_EVENTS, trackClick } from '../client/analytics'
import { MatchCard } from './MatchCard'

export function ScheduleView({ matches, onBack, onMatchSelect }) {
  const dateSectionRefs = useRef(new Map())
  const sortedMatches = useMemo(() => [...matches].sort(compareMatchesByKickoff), [matches])
  const handleMatchSelect = onMatchSelect
    ? (selectedMatch) => {
        trackClick(CLICK_EVENTS.SCHEDULE_MATCH_CLICK, {
          featureArea: 'schedule',
          pageView: 'schedule',
          targetId: selectedMatch.id,
          targetLabel: getMatchLabel(selectedMatch),
          metadata: {
            matchStatus: selectedMatch.status,
          },
        })
        onMatchSelect(selectedMatch)
      }
    : undefined

  const dateEntries = useMemo(() => {
    const matchesByDate = sortedMatches.reduce((dates, match) => {
      const dateKey = getMatchDateKey(match)
      dates[dateKey] = dates[dateKey] ? [...dates[dateKey], match] : [match]
      return dates
    }, {})

    return Object.entries(matchesByDate).sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
  }, [sortedMatches])
  const initialScrollDate = getInitialScrollDate(dateEntries.map(([date]) => date), getTodayDateKey())

  useEffect(() => {
    if (!initialScrollDate) {
      return
    }

    dateSectionRefs.current.get(initialScrollDate)?.scrollIntoView?.({
      block: 'start',
    })
  }, [initialScrollDate])

  return (
    <main className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 sm:pb-8 lg:px-8">
      <div className="sticky top-0 z-30 -mx-4 bg-eggshell/95 px-4 py-4 backdrop-blur dark:bg-twilight_indigo-100/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-300 dark:focus:ring-burnt_peach-600 dark:focus:ring-offset-twilight_indigo-100"
          aria-label="Back to match hub"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Match hub
        </button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-burnt_peach-300 dark:text-burnt_peach-600 sm:text-sm">Real schedule</p>
          <h1 className="mt-1 text-2xl font-black text-twilight_indigo dark:text-eggshell-800 sm:mt-2 sm:text-2xl">Full World Cup 2026 schedule</h1>
        </div>
        <p className="rounded bg-muted_teal-900 px-3 py-2 text-sm font-black text-muted_teal-300 dark:bg-muted_teal-100 dark:text-muted_teal-700">
          {matches.length} fixtures
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-lg border border-twilight_indigo-900 bg-white p-6 text-xs font-bold text-twilight_indigo-600 shadow-panel dark:border-white/10 dark:bg-twilight_indigo-200 dark:text-eggshell-600">
          Fixtures will appear here once Supabase has schedule rows.
        </div>
      ) : (
        <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
          {dateEntries.map(([date, dateMatches]) => (
            <section
              key={date}
              ref={(element) => {
                if (element) {
                  dateSectionRefs.current.set(date, element)
                } else {
                  dateSectionRefs.current.delete(date)
                }
              }}
              aria-labelledby={`schedule-${date}`}
            >
              <h2
                id={`schedule-${date}`}
                className="sticky top-16 z-10 flex items-center gap-2 border-y border-twilight_indigo-900 bg-eggshell py-2 text-lg font-black dark:border-white/10 dark:bg-twilight_indigo-100 dark:text-eggshell-800 sm:top-[4.5rem] sm:py-3 sm:text-xl"
              >
                <CalendarDays aria-hidden="true" className="h-5 w-5 text-muted_teal-300 dark:text-muted_teal-600" />
                {formatDate(date)}
              </h2>
              <div className="mt-3 grid gap-3">
                {[...dateMatches].sort(compareMatchesByKickoff).map((match) => (
                  <div key={match.id}>
                    <MatchCard match={match} onMatchSelect={handleMatchSelect} />
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

function getMatchLabel(match) {
  return `${match.home.name ?? match.home.code} vs ${match.away.name ?? match.away.code}`
}

function compareMatchesByKickoff(first, second) {
  const firstTime = getKickoffTime(first)
  const secondTime = getKickoffTime(second)

  if (firstTime !== secondTime) {
    return firstTime - secondTime
  }

  return first.id.localeCompare(second.id)
}

function getKickoffTime(match) {
  return new Date(match.kickoffAt ?? `${match.date}T00:00:00Z`).getTime()
}

function getMatchDateKey(match) {
  if (!match.kickoffAt) {
    return match.date
  }

  const kickoff = new Date(match.kickoffAt)

  if (Number.isNaN(kickoff.getTime())) {
    return match.date
  }

  const year = kickoff.getFullYear()
  const month = String(kickoff.getMonth() + 1).padStart(2, '0')
  const day = String(kickoff.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getInitialScrollDate(dates, todayDateKey) {
  if (dates.length === 0) {
    return null
  }

  return dates.find((date) => date >= todayDateKey) ?? dates[dates.length - 1]
}

function getTodayDateKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(date) {
  const [year, month, day] = date.split('-').map(Number)

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}
