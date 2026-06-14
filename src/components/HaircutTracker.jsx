import { ChevronDown, Scissors, Share2 } from 'lucide-react'
import { useState } from 'react'
import { CLICK_EVENTS, trackClick } from '../client/analytics'
import { buildHaircutShareText, CUT_THRESHOLD, getHaircutPunchline } from './haircutTrackerCopy'

const WCFANS_URL = 'https://wc-fans.vercel.app'

const copyShareText = (text) => window.navigator.clipboard?.writeText(text)

export function HaircutTracker({ teams, copyText = copyShareText }) {
  const [expanded, setExpanded] = useState(false)
  const [sharedTeam, setSharedTeam] = useState(null)
  const sortedTeams = [...teams].sort((a, b) => b.winsInARow - a.winsInARow)
  const visibleTeams = expanded ? sortedTeams : sortedTeams.slice(0, 4)
  const hasTeams = teams.length > 0

  const shareTeam = async (team) => {
    const browserNavigator = window.navigator
    const shareText = `${buildHaircutShareText(team)}\n${WCFANS_URL}`
    const title = `${team.team} haircut tracker`
    const shareMethod = browserNavigator.share ? 'native_share' : 'clipboard'

    trackClick(CLICK_EVENTS.HAIRCUT_SHARE_CLICK, {
      featureArea: 'haircut_tracker',
      pageView: 'home',
      targetId: team.id,
      targetLabel: team.team,
      metadata: {
        winsInARow: team.winsInARow,
        canCutHair: team.canCutHair,
        shareMethod,
      },
    })

    try {
      if (browserNavigator.share) {
        await browserNavigator.share({ title, text: shareText })
      } else {
        await copyText(shareText)
      }

      setSharedTeam(team.id)
    } catch {
      setSharedTeam(null)
    }
  }

  return (
    <section className="rounded-lg bg-twilight_indigo p-4 text-eggshell shadow-panel dark:bg-twilight_indigo-200 dark:ring-1 dark:ring-white/10 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-apricot_cream dark:text-apricot_cream-600 sm:text-sm">Fan ritual</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Haircut tracker</h2>
        </div>
        {hasTeams ? (
          <button
            type="button"
            onClick={() => {
              trackClick(CLICK_EVENTS.HAIRCUT_EXPAND_CLICK, {
                featureArea: 'haircut_tracker',
                pageView: 'home',
                metadata: {
                  expandedTo: !expanded,
                },
              })
              setExpanded((current) => !current)
            }}
            className="inline-flex items-center gap-2 rounded bg-eggshell px-4 py-2 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo dark:bg-twilight_indigo-300 dark:text-eggshell-800 dark:ring-1 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-apricot_cream-600 dark:focus:ring-offset-twilight_indigo-200"
            aria-expanded={expanded}
          >
            <Scissors aria-hidden="true" className="h-4 w-4" />
            {expanded ? 'Show less' : 'Show all'}
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <span className="rounded bg-eggshell px-3 py-2 text-xs font-black uppercase text-twilight_indigo dark:bg-twilight_indigo-300 dark:text-eggshell-800 dark:ring-1 dark:ring-white/10">
            No streak data
          </span>
        )}
      </div>
      <p className="mt-4 rounded bg-white/10 px-3 py-2 text-xs font-bold text-eggshell-600 ring-1 ring-white/15 dark:text-eggshell-700">
        Haircut streaks update after standings refresh from final matches; in-progress matches are not reflected.
      </p>
      {hasTeams ? (
        <div className={expanded ? 'mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 xl:grid-cols-4' : 'mt-4 flex gap-3 overflow-x-auto pb-1 sm:mt-5'}>
          {visibleTeams.map((team) => (
            <article
              key={team.id}
              className={`rounded-lg bg-white/10 p-3 ring-1 ring-white/15 dark:bg-twilight_indigo-300 sm:p-4 ${expanded ? '' : 'min-w-56 flex-1 sm:min-w-64'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <TeamName team={team} />
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap rounded px-2 py-1 text-xs font-black uppercase ${
                    team.canCutHair ? 'bg-muted_teal text-twilight_indigo-100 dark:bg-muted_teal-600' : 'bg-eggshell text-twilight_indigo dark:bg-twilight_indigo-400 dark:text-eggshell-800'
                  }`}
                >
                  {team.canCutHair ? 'Eligible' : `${CUT_THRESHOLD - team.winsInARow} to go`}
                </span>
              </div>
              <div className="mt-4" aria-label={`${team.team} winning streak: ${team.winsInARow} of ${CUT_THRESHOLD}`}>
                <div className="h-2 overflow-hidden rounded bg-white/20">
                  <div
                    className="h-full rounded bg-apricot_cream dark:bg-apricot_cream-600"
                    style={{ width: `${Math.min(team.winsInARow, CUT_THRESHOLD) * 20}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-eggshell-600">
                  {team.winsInARow}/{CUT_THRESHOLD} wins in a row
                </p>
                <p className="mt-2 text-sm font-black text-apricot_cream dark:text-apricot_cream-600 sm:text-base">{getHaircutPunchline(team.winsInARow)}</p>
              </div>
              <button
                type="button"
                onClick={() => shareTeam(team)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-eggshell px-3 py-2 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo dark:bg-twilight_indigo-100 dark:text-eggshell-800 dark:ring-1 dark:ring-white/10 dark:hover:bg-twilight_indigo-400 dark:focus:ring-apricot_cream-600 dark:focus:ring-offset-twilight_indigo-200"
                aria-label={`Share ${team.team} haircut tracker`}
              >
                <Share2 aria-hidden="true" className="h-4 w-4" />
                {sharedTeam === team.id ? 'Shared' : 'Share'}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function TeamName({ team }) {
  return (
    <h3 className="flex min-w-0 items-start gap-2 text-base font-black leading-tight sm:text-lg">
      {team.logo ? <img className="h-5 w-5 shrink-0 rounded-full bg-white object-contain sm:h-6 sm:w-6" src={team.logo} alt="" /> : null}
      {team.flag ? <span aria-hidden="true">{team.flag}</span> : null}
      <span className="line-clamp-2 min-w-0">{team.team}</span>
    </h3>
  )
}
