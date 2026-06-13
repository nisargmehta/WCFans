export function NewsFeed({ articles }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-twilight_indigo-900 bg-white p-6 text-xs font-bold text-twilight_indigo-600 shadow-panel dark:border-white/10 dark:bg-twilight_indigo-200 dark:text-eggshell-600">
        Latest RSS stories will appear here when a configured feed is reachable.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {articles.map((article) => (
        <article
          key={article.id}
          className="overflow-hidden rounded-lg border border-twilight_indigo-900 bg-white shadow-panel dark:border-white/10 dark:bg-twilight_indigo-200"
        >
          <img className="h-32 w-full object-cover sm:h-40" src={article.image} alt="" loading="lazy" />
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase text-muted_teal-300 dark:text-muted_teal-600">
              <span>{article.category}</span>
              <time>{article.timestamp}</time>
            </div>
            <h3 className="mt-2 text-base font-black leading-snug text-twilight_indigo dark:text-eggshell-800 sm:mt-3 sm:text-lg">
              <a className="hover:text-burnt_peach-300 dark:hover:text-burnt_peach-600" href={article.url} target="_blank" rel="noreferrer">
                {article.headline}
              </a>
            </h3>
          </div>
        </article>
      ))}
    </div>
  )
}
