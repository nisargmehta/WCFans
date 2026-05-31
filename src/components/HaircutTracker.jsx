import { Scissors } from 'lucide-react'

export function HaircutTracker({ teams }) {
  const sortedTeams = [...teams].sort((a, b) => b.winsInARow - a.winsInARow)

  return (
    <section className="rounded-lg bg-twilight_indigo p-5 text-eggshell shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-apricot_cream">Fan challenge</p>
          <h2 className="mt-1 text-2xl font-black">Haircut tracker</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-burnt_peach text-eggshell">
          <Scissors aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sortedTeams.map((team) => (
          <article key={team.id} className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black">
                  <span aria-hidden="true">{team.flag}</span> {team.team}
                </h3>
                <p className="text-sm text-eggshell-600">Group {team.group}</p>
              </div>
              <span
                className={`rounded px-2 py-1 text-xs font-black uppercase ${
                  team.canCutHair ? 'bg-muted_teal text-twilight_indigo-100' : 'bg-eggshell text-twilight_indigo'
                }`}
              >
                {team.canCutHair ? 'Eligible' : `${5 - team.winsInARow} to go`}
              </span>
            </div>
            <div className="mt-4" aria-label={`${team.team} winning streak: ${team.winsInARow} of 5`}>
              <div className="h-2 overflow-hidden rounded bg-white/20">
                <div
                  className="h-full rounded bg-apricot_cream"
                  style={{ width: `${Math.min(team.winsInARow, 5) * 20}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-eggshell-600">{team.winsInARow}/5 wins in a row</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
