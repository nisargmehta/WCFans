export const hasPublishedLineups = (match) =>
  hasItems(match?.details?.homeLineup) || hasItems(match?.details?.awayLineup)

const hasItems = (items) => Array.isArray(items) && items.length > 0
