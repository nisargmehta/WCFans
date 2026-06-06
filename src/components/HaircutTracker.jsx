import { ChevronDown, Scissors, Share2 } from 'lucide-react'
import { useState } from 'react'
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
    <section className="rounded-lg bg-twilight_indigo p-5 text-eggshell shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-apricot_cream">Fan challenge</p>
          <h2 className="mt-1 text-2xl font-black">Haircut tracker</h2>
        </div>
        {hasTeams ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded bg-eggshell px-4 py-2 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo"
            aria-expanded={expanded}
          >
            <Scissors aria-hidden="true" className="h-4 w-4" />
            {expanded ? 'Show less' : 'Show all'}
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <span className="rounded bg-eggshell px-3 py-2 text-xs font-black uppercase text-twilight_indigo">
            No streak data
          </span>
        )}
      </div>
      {!hasTeams ? (
        <div className="mt-5 rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
          <p className="text-sm font-bold text-eggshell">Streaks will appear once tournament standings are available.</p>
          <p className="mt-2 text-sm text-eggshell-600">Until then, every fan keeps their hair.</p>
        </div>
      ) : null}
      {hasTeams ? (
        <div
          className={expanded ? 'mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4' : 'mt-5 flex gap-3 overflow-x-auto pb-1'}
        >
          {visibleTeams.map((team) => (
            <article
              key={team.id}
              className={`rounded-lg bg-white/10 p-4 ring-1 ring-white/15 ${expanded ? '' : 'min-w-64 flex-1'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <TeamName team={team} />
                  <p className="text-sm text-eggshell-600">Group {team.group}</p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-xs font-black uppercase ${
                    team.canCutHair ? 'bg-muted_teal text-twilight_indigo-100' : 'bg-eggshell text-twilight_indigo'
                  }`}
                >
                  {team.canCutHair ? 'Eligible' : `${CUT_THRESHOLD - team.winsInARow} to go`}
                </span>
              </div>
              <div className="mt-4" aria-label={`${team.team} winning streak: ${team.winsInARow} of ${CUT_THRESHOLD}`}>
                <div className="h-2 overflow-hidden rounded bg-white/20">
                  <div
                    className="h-full rounded bg-apricot_cream"
                    style={{ width: `${Math.min(team.winsInARow, CUT_THRESHOLD) * 20}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-eggshell-600">
                  {team.winsInARow}/{CUT_THRESHOLD} wins in a row
                </p>
                <p className="mt-2 text-base font-black text-apricot_cream">{getHaircutPunchline(team.winsInARow)}</p>
              </div>
              <button
                type="button"
                onClick={() => shareTeam(team)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-eggshell px-3 py-2 text-sm font-black text-twilight_indigo transition hover:bg-eggshell-600 focus:outline-none focus:ring-2 focus:ring-apricot_cream focus:ring-offset-2 focus:ring-offset-twilight_indigo"
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
    <h3 className="flex min-w-0 items-center gap-2 text-lg font-black">
      {team.logo ? <img className="h-6 w-6 shrink-0 rounded-full bg-white object-contain" src={team.logo} alt="" /> : null}
      {team.flag ? <span aria-hidden="true">{team.flag}</span> : null}
      <span className="truncate">{team.team}</span>
    </h3>
  )
}
