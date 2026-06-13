import { ArrowLeft, Clock, Copy, MapPin, MessageCircle, RefreshCcw, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CLICK_EVENTS, trackClick } from '../client/analytics'
import { buildExcuseOptions, buildExcuseShareText, getLosingSide } from './excuseGenerator'
import { MatchDetails } from './MatchDetails'

export function MatchDetailsView({ match, onBack, backLabel = 'Match hub' }) {
  const isLive = match.status === 'Live'
  const losingSide = getLosingSide(match)
  const excuseOptions = useMemo(
    () => (losingSide ? buildExcuseOptions(match, losingSide) : []),
    [losingSide, match],
  )
  const [excuseIndex, setExcuseIndex] = useState(null)
  const [shareStatus, setShareStatus] = useState('')
  const activeExcuse = excuseIndex === null ? null : excuseOptions[excuseIndex]
  const canShareExcuse = typeof navigator.share === 'function'

  useEffect(() => {
    setExcuseIndex(null)
    setShareStatus('')
  }, [match.id])

  const openExcuseGenerator = () => {
    trackFanDefenseClick(CLICK_EVENTS.FAN_DEFENSE_GENERATE_CLICK)
    setShareStatus('')
    setExcuseIndex(getRandomIndex(excuseOptions))
  }

  const regenerateExcuse = () => {
    trackFanDefenseClick(CLICK_EVENTS.FAN_DEFENSE_REGENERATE_CLICK)
    setShareStatus('')
    setExcuseIndex((current) => getNextIndex(excuseOptions, current))
  }

  const shareExcuse = async () => {
    if (!activeExcuse || !losingSide) {
      return
    }

    const text = buildExcuseShareText(match, losingSide, activeExcuse)
    const shareMethod = canShareExcuse ? 'native_share' : 'clipboard'

    trackFanDefenseClick(CLICK_EVENTS.FAN_DEFENSE_SHARE_CLICK, {
      shareMethod,
    })

    try {
      if (canShareExcuse) {
        await navigator.share({
          title: `${match[losingSide].name} fan defense`,
          text,
        })
        setShareStatus('Shared')
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setShareStatus('Copied')
        return
      }

      setShareStatus('Ready')
    } catch {
      setShareStatus('Ready')
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <button
        type="button"
        onClick={() => {
          trackClick(CLICK_EVENTS.MATCH_BACK_CLICK, {
            featureArea: 'match_details',
            pageView: 'match',
            targetId: match.id,
            targetLabel: getMatchLabel(match),
            metadata: {
              backLabel,
            },
          })
          onBack?.()
        }}
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
          <TeamHeading
            team={match.home}
            onGenerateExcuse={losingSide === 'home' ? openExcuseGenerator : null}
          />
          <div className="rounded bg-twilight_indigo px-3 py-2 text-center text-xl font-black text-eggshell dark:bg-burnt_peach-500 dark:text-twilight_indigo-100">
            {formatScore(match)}
          </div>
          <TeamHeading
            team={match.away}
            align="right"
            onGenerateExcuse={losingSide === 'away' ? openExcuseGenerator : null}
          />
        </div>
        <p className="mt-3 rounded bg-eggshell-800 px-3 py-2 text-xs font-bold text-twilight_indigo-600 dark:bg-twilight_indigo-300 dark:text-eggshell-600">
          Scores and match events may be delayed while the data provider feed catches up.
        </p>

        {activeExcuse && losingSide ? (
          <div className="mt-4 rounded border border-burnt_peach-800 bg-burnt_peach-900 p-3 text-twilight_indigo shadow-inner dark:border-burnt_peach-500/30 dark:bg-twilight_indigo-300 dark:text-eggshell-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black leading-snug sm:text-base">
                <span className="mr-2 text-burnt_peach-300 dark:text-burnt_peach-600">Fan Defense:</span>
                {activeExcuse}
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={regenerateExcuse}
                  className="inline-flex h-10 w-10 items-center justify-center rounded bg-white text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 dark:bg-twilight_indigo-200 dark:text-eggshell-800 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-burnt_peach-600"
                  aria-label={`Generate another fan defense for ${match[losingSide].name}`}
                  title="Generate another fan defense"
                >
                  <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={shareExcuse}
                  className="inline-flex h-10 items-center gap-2 rounded bg-twilight_indigo px-3 text-sm font-black text-eggshell shadow-panel transition hover:bg-twilight_indigo-600 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 dark:bg-burnt_peach-500 dark:text-twilight_indigo-100 dark:hover:bg-burnt_peach-600 dark:focus:ring-burnt_peach-600"
                  aria-label={`Share fan defense for ${match[losingSide].name}`}
                >
                  {canShareExcuse ? <Share2 aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  {shareStatus || (canShareExcuse ? 'Share' : 'Copy')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
    </main>
  )

  function trackFanDefenseClick(eventName, metadata = {}) {
    if (!losingSide) {
      return
    }

    trackClick(eventName, {
      featureArea: 'match_details',
      pageView: 'match',
      targetId: match.id,
      targetLabel: match[losingSide].name,
      metadata: {
        losingSide,
        matchLabel: getMatchLabel(match),
        ...metadata,
      },
    })
  }
}

function getMatchLabel(match) {
  return `${match.home.name ?? match.home.code} vs ${match.away.name ?? match.away.code}`
}

function TeamHeading({ team, align = 'left', onGenerateExcuse = null }) {
  return (
    <div className={`min-w-0 px-1 ${align === 'right' ? 'text-right' : ''}`}>
      <div className={`flex min-w-0 items-start gap-3 ${align === 'right' ? 'justify-end' : ''}`}>
        <h2 className="min-w-0 break-words text-xl font-black leading-tight text-twilight_indigo dark:text-eggshell-800 sm:text-2xl">
          <span aria-hidden="true">{team.flag}</span> {team.name}
        </h2>
        {onGenerateExcuse ? (
          <button
            type="button"
            onClick={onGenerateExcuse}
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-burnt_peach-900 text-burnt_peach-300 ring-1 ring-burnt_peach-800 transition hover:bg-burnt_peach-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 dark:bg-twilight_indigo-300 dark:text-burnt_peach-600 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-burnt_peach-600"
            aria-label={`Generate fan defense for ${team.name}`}
            title={`Generate fan defense for ${team.name}`}
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
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

function getRandomIndex(items) {
  return items.length > 0 ? Math.floor(Math.random() * items.length) : null
}

function getNextIndex(items, current) {
  if (items.length === 0) {
    return null
  }

  if (items.length === 1 || current === null) {
    return 0
  }

  return (current + 1) % items.length
}
