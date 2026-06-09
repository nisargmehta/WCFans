import { ArrowLeft, Trophy } from 'lucide-react'

export function StandingsView({ standings, onBack }) {
  const standingsByGroup = standings.reduce((groups, row) => {
    const groupName = row.group_name ?? 'Overall'
    groups[groupName] = groups[groupName] ? [...groups[groupName], row] : [row]
    return groups
  }, {})

  const groupEntries = Object.entries(standingsByGroup).sort(([first], [second]) => first.localeCompare(second))

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-black text-twilight_indigo shadow-panel ring-1 ring-twilight_indigo-900 transition hover:bg-eggshell-800 focus:outline-none focus:ring-2 focus:ring-burnt_peach-300 focus:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Match hub
      </button>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 sm:mt-6">
        <div>
          <p className="text-xs font-black uppercase text-burnt_peach-300 sm:text-sm">Group tables</p>
          <h1 className="mt-1 text-2xl font-black text-twilight_indigo sm:mt-2 sm:text-2xl">World Cup 2026 standings</h1>
        </div>
        <p className="rounded bg-muted_teal-900 px-3 py-2 text-sm font-black text-muted_teal-300">
          {standings.length} teams
        </p>
      </div>
      <p className="mt-4 rounded bg-white px-3 py-2 text-sm font-bold text-twilight_indigo-600 shadow-panel ring-1 ring-twilight_indigo-900">
        Standings update after matches are final; in-progress matches are not reflected.
      </p>

      {standings.length === 0 ? (
        <div className="mt-6 rounded-lg border border-twilight_indigo-900 bg-white p-6 text-sm font-bold text-twilight_indigo-600 shadow-panel">
          Standings will appear here once Supabase has group table rows.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-2">
          {groupEntries.map(([groupName, rows]) => (
            <section
              key={groupName}
              aria-labelledby={`standings-${groupName}`}
              className="overflow-hidden rounded-lg border border-twilight_indigo-900 bg-white shadow-panel"
            >
              <h2
                id={`standings-${groupName}`}
                className="flex items-center gap-2 border-b border-twilight_indigo-900 bg-twilight_indigo px-3 py-2.5 text-base font-black text-eggshell sm:px-4 sm:py-3 sm:text-lg"
              >
                <Trophy aria-hidden="true" className="h-5 w-5 text-apricot_cream" />
                {groupName}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-eggshell-800 text-xs font-black uppercase text-twilight_indigo-600">
                    <tr>
                      <th scope="col" className="w-12 px-3 py-2">
                        #
                      </th>
                      <th scope="col" className="min-w-44 px-3 py-2">
                        Team
                      </th>
                      <th scope="col" className="px-3 py-2 text-center">
                        P
                      </th>
                      <th scope="col" className="px-3 py-2 text-center">
                        W
                      </th>
                      <th scope="col" className="px-3 py-2 text-center">
                        D
                      </th>
                      <th scope="col" className="px-3 py-2 text-center">
                        L
                      </th>
                      <th scope="col" className="px-3 py-2 text-center">
                        GD
                      </th>
                      <th scope="col" className="px-3 py-2 text-center">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-twilight_indigo-900">
                    {rows
                      .sort((first, second) => (first.rank ?? 999) - (second.rank ?? 999))
                      .map((row) => (
                        <tr key={row.team_id} className="text-twilight_indigo">
                          <td className="px-3 py-3 text-sm font-black">{row.rank ?? '-'}</td>
                          <td className="px-3 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                              {row.team_logo ? (
                                <img className="h-6 w-6 shrink-0 rounded-full bg-eggshell object-contain" src={row.team_logo} alt="" />
                              ) : null}
                              <span className="truncate font-black">{row.team_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-bold">{row.all_played ?? 0}</td>
                          <td className="px-3 py-3 text-center font-bold">{row.all_win ?? 0}</td>
                          <td className="px-3 py-3 text-center font-bold">{row.all_draw ?? 0}</td>
                          <td className="px-3 py-3 text-center font-bold">{row.all_lose ?? 0}</td>
                          <td className="px-3 py-3 text-center font-bold">{formatGoalDiff(row.goals_diff)}</td>
                          <td className="px-3 py-3 text-center text-base font-black">{row.points ?? 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function formatGoalDiff(value) {
  if (typeof value !== 'number') {
    return 0
  }

  return value > 0 ? `+${value}` : value
}
