import { Radio } from 'lucide-react'

export function LiveScoresTicker({ matches }) {
  const visibleMatches = matches.slice(0, 4)

  return (
    <section
      className="overflow-hidden border-y border-twilight_indigo-900 bg-twilight_indigo text-eggshell-900"
      aria-label="Live scores ticker"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2 text-sm font-bold uppercase tracking-wide text-apricot_cream">
          <Radio aria-hidden="true" className="h-4 w-4" />
          Live
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-[ticker_32s_linear_infinite] gap-8 pr-8 motion-reduce:animate-none">
            {[...visibleMatches, ...visibleMatches].map((match, index) => (
              <div key={`${match.id}-${index}`} className="flex items-center gap-3 text-sm sm:text-base">
                <span className="font-semibold">
                  {match.home.flag} {match.home.code}
                </span>
                <span className="rounded bg-eggshell px-2 py-1 font-black text-twilight_indigo">
                  {match.score.home} - {match.score.away}
                </span>
                <span className="font-semibold">
                  {match.away.code} {match.away.flag}
                </span>
                <span className="text-eggshell-600">{match.minute}'</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
