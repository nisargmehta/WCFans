export function NewsFeed({ articles }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-twilight_indigo-900 bg-white p-6 text-sm font-bold text-twilight_indigo-600 shadow-panel">
        Latest RSS stories will appear here when a configured feed is reachable.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {articles.map((article) => (
        <article
          key={article.id}
          className="overflow-hidden rounded-lg border border-twilight_indigo-900 bg-white shadow-panel"
        >
          <img className="h-40 w-full object-cover" src={article.image} alt="" loading="lazy" />
          <div className="p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase text-muted_teal-300">
              <span>{article.category}</span>
              <time>{article.timestamp}</time>
            </div>
            <h3 className="mt-3 text-lg font-black leading-snug text-twilight_indigo">
              <a className="hover:text-burnt_peach-300" href={article.url} target="_blank" rel="noreferrer">
                {article.headline}
              </a>
            </h3>
          </div>
        </article>
      ))}
    </div>
  )
}
