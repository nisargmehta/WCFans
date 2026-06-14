import { MessageCircle, RefreshCcw, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CLICK_EVENTS, trackClick } from '../client/analytics'
import { buildExcuseOptions, buildExcuseShareText } from './excuseGenerator'
import { getRecentFanDefenseMatches } from './fanDefenseMatches'

export function FanDefenseSection({ matches, copyText = copyShareText, browserNavigator = getBrowserNavigator() }) {
  const fanDefenseMatches = useMemo(() => getRecentFanDefenseMatches(matches), [matches])
  const [defensesByMatchId, setDefensesByMatchId] = useState({})

  if (fanDefenseMatches.length === 0) {
    return null
  }

  const canNativeShare = typeof browserNavigator.share === 'function'

  const generateDefense = (match) => {
    const excuseOptions = buildExcuseOptions(match, match.losingSide)

    trackFanDefenseClick(CLICK_EVENTS.FAN_DEFENSE_GENERATE_CLICK, match)
    setDefensesByMatchId((current) => ({
      ...current,
      [match.id]: {
        excuseIndex: getRandomIndex(excuseOptions),
        shareStatus: '',
      },
    }))
  }

  const regenerateDefense = (match) => {
    const excuseOptions = buildExcuseOptions(match, match.losingSide)

    trackFanDefenseClick(CLICK_EVENTS.FAN_DEFENSE_REGENERATE_CLICK, match)
    setDefensesByMatchId((current) => ({
      ...current,
      [match.id]: {
        excuseIndex: getNextIndex(excuseOptions, current[match.id]?.excuseIndex ?? null),
        shareStatus: '',
      },
    }))
  }

  const shareDefense = async (match, activeExcuse) => {
    const text = buildExcuseShareText(match, match.losingSide, activeExcuse)
    const shareMethod = canNativeShare ? 'native_share' : 'clipboard'

    trackFanDefenseClick(CLICK_EVENTS.FAN_DEFENSE_SHARE_CLICK, match, { shareMethod })

    try {
      if (canNativeShare) {
        await browserNavigator.share({
          text,
        })
        updateShareStatus(match.id, 'Shared')
        return
      }

      await copyText(text)
      updateShareStatus(match.id, 'Shared')
    } catch {
      updateShareStatus(match.id, 'Ready')
    }
  }

  return (
    <section
      aria-labelledby="fan-defense-heading"
      className="rounded-lg bg-twilight_indigo p-4 text-eggshell shadow-panel dark:bg-twilight_indigo-200 dark:ring-1 dark:ring-white/10 sm:p-5"
    >
      <div>
        <p className="text-xs font-bold uppercase text-apricot_cream dark:text-apricot_cream-600 sm:text-sm">Fan challenge</p>
        <h2 id="fan-defense-heading" className="mt-1 text-xl font-black sm:text-2xl">
          Fan defense
        </h2>
        <p className="mt-2 max-w-2xl text-xs font-bold leading-snug text-eggshell-600">
          only most recent losses are here, to look at all results go to full schedule. fan defense updates after standings refresh
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:mt-5 md:grid-cols-2 xl:grid-cols-4">
        {fanDefenseMatches.map((match) => {
          const defenseState = defensesByMatchId[match.id]
          const excuseOptions = buildExcuseOptions(match, match.losingSide)
          const activeExcuse = defenseState?.excuseIndex == null ? null : excuseOptions[defenseState.excuseIndex]

          return (
            <article
              key={match.id}
              className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15 dark:bg-twilight_indigo-300 sm:p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-black leading-tight sm:text-lg">
                    <span aria-hidden="true">{match.losingTeam.flag}</span> {match.losingTeam.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-eggshell-600">
                    lost {formatLossScore(match)} to {match.opponent.name}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-eggshell px-2 py-1 text-xs font-black uppercase text-twilight_indigo dark:bg-twilight_indigo-400 dark:text-eggshell-800">
                  {match.losingTeam.code}
                </span>
              </div>

              {activeExcuse ? (
                <>
                  <p className="mt-4 rounded bg-white/10 p-3 text-sm font-black leading-snug text-apricot_cream ring-1 ring-white/15 dark:text-apricot_cream-600">
                    {activeExcuse}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => regenerateDefense(match)}
                      className="inline-flex h-10 items-center gap-2 rounded bg-eggshell px-3 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo dark:bg-twilight_indigo-100 dark:text-eggshell-800 dark:ring-1 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-apricot_cream-600 dark:focus:ring-offset-twilight_indigo-200"
                      aria-label={`Generate another fan defense for ${match.losingTeam.name}`}
                    >
                      <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                      Re-generate
                    </button>
                    <button
                      type="button"
                      onClick={() => shareDefense(match, activeExcuse)}
                      className="inline-flex h-10 items-center gap-2 rounded bg-eggshell px-3 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo dark:bg-twilight_indigo-100 dark:text-eggshell-800 dark:ring-1 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-apricot_cream-600 dark:focus:ring-offset-twilight_indigo-200"
                      aria-label={`Share fan defense for ${match.losingTeam.name}`}
                    >
                      <Share2 aria-hidden="true" className="h-4 w-4" />
                      {defenseState.shareStatus || 'Share'}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => generateDefense(match)}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-eggshell px-3 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo dark:bg-twilight_indigo-100 dark:text-eggshell-800 dark:ring-1 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-apricot_cream-600 dark:focus:ring-offset-twilight_indigo-200"
                  aria-label={`Generate fan defense for ${match.losingTeam.name}`}
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                  Generate defense
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )

  function updateShareStatus(matchId, shareStatus) {
    setDefensesByMatchId((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        shareStatus,
      },
    }))
  }
}

function formatLossScore(match) {
  const losingScore = match.score[match.losingSide]
  const opponentScore = match.score[match.losingSide === 'home' ? 'away' : 'home']

  return `${opponentScore}-${losingScore}`
}

function trackFanDefenseClick(eventName, match, metadata = {}) {
  trackClick(eventName, {
    featureArea: 'fan_defense',
    pageView: 'home',
    targetId: match.id,
    targetLabel: match.losingTeam.name,
    metadata: {
      losingSide: match.losingSide,
      matchLabel: `${match.home.name ?? match.home.code} vs ${match.away.name ?? match.away.code}`,
      ...metadata,
    },
  })
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

async function copyShareText(text) {
  const browserNavigator = getBrowserNavigator()

  if (!browserNavigator.clipboard?.writeText) {
    throw new Error('Clipboard unavailable')
  }

  await browserNavigator.clipboard.writeText(text)
}

function getBrowserNavigator() {
  return typeof navigator === 'undefined' ? {} : navigator
}
