import { Activity, History, Star, Stethoscope } from 'lucide-react'

const sections = [
  {
    key: 'headToHead',
    label: 'Head to head',
    icon: History,
  },
  {
    key: 'playersToWatch',
    label: 'Players to watch',
    icon: Star,
  },
  {
    key: 'injuries',
    label: 'Injuries',
    icon: Stethoscope,
  },
]

export function FixtureInsights({ insights }) {
  if (!insights) {
    return null
  }

  return (
    <div className="mt-4 border-t border-twilight_indigo-900 pt-4">
      <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-muted_teal-300">
        <Activity aria-hidden="true" className="h-4 w-4" />
        {insights.refreshLabel}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {sections.map(({ key, label, icon: Icon }) => (
          <section key={key} aria-label={label} className="rounded bg-eggshell-800 p-3">
            <h3 className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-twilight_indigo-600">
              <Icon aria-hidden="true" className="h-4 w-4 text-burnt_peach-300" />
              {label}
            </h3>
            <InsightBody insight={insights[key]} />
          </section>
        ))}
      </div>
    </div>
  )
}

function InsightBody({ insight }) {
  const items = Array.isArray(insight) ? insight : [insight]

  return (
    <ul className="mt-2 space-y-2">
      {items.map((item, index) => (
        <li key={`${item.summary}-${index}`} className="text-sm font-semibold leading-snug text-twilight_indigo">
          <InsightText item={item} />
        </li>
      ))}
    </ul>
  )
}

function InsightText({ item }) {
  const source = item.sources?.[0]

  if (!source?.url || source.url === '#') {
    return item.summary
  }

  return (
    <a className="underline decoration-muted_teal-300 underline-offset-4 hover:text-burnt_peach-300" href={source.url}>
      {item.summary}
    </a>
  )
}
