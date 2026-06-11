export const hasPublishedLineups = (match) =>
  hasItems(match?.details?.homeLineup) || hasItems(match?.details?.awayLineup)

export const hasMatchFeedData = (match) => {
  const details = match?.details ?? {}

  return Boolean(
    hasPublishedLineups(match) ||
      hasItems(details.referees) ||
      hasItems(details.goals) ||
      hasItems(details.bookings) ||
      hasItems(details.substitutions) ||
      hasItems(details.penalties) ||
      hasStats(details.homeStatistics) ||
      hasStats(details.awayStatistics) ||
      details.syncedAt,
  )
}

const hasItems = (items) => Array.isArray(items) && items.length > 0

const hasStats = (stats) => Boolean(stats && typeof stats === 'object' && Object.keys(stats).length > 0)
