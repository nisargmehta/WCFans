const DEFAULT_WINDOW_HOURS = 24

const emptyInsight = (summary) => ({
  summary,
  sources: [],
})

export const buildEmptyFixturePreview = (generatedAt = new Date().toISOString()) => ({
  generatedAt,
  refreshLabel: 'Prematch preview pending',
  headToHead: emptyInsight('Head-to-head record will appear after the preview job runs.'),
  playersToWatch: [emptyInsight('Players to watch will appear after the preview job runs.')],
  injuries: [emptyInsight('Injury updates will appear after the preview job runs.')],
})

export const normalizeFixturePreview = (preview) => {
  if (!preview) {
    return buildEmptyFixturePreview()
  }

  return {
    generatedAt: preview.generated_at ?? preview.generatedAt,
    refreshLabel: preview.refresh_label ?? preview.refreshLabel ?? 'Prematch preview refreshed',
    headToHead: {
      summary:
        preview.head_to_head_summary ??
        preview.headToHead?.summary ??
        'Head-to-head record will appear after the preview job runs.',
      sources: preview.head_to_head_sources ?? preview.headToHead?.sources ?? [],
    },
    playersToWatch:
      preview.players_to_watch ??
      preview.playersToWatch ?? [emptyInsight('Players to watch will appear after the preview job runs.')],
    injuries: preview.injuries ?? [emptyInsight('Injury updates will appear after the preview job runs.')],
  }
}

const kickoffDate = (match) => {
  const timeMatch = match.time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/)
  if (!timeMatch) {
    return new Date(`${match.date}T12:00:00Z`)
  }

  const [, hour, minute, offset] = timeMatch
  const [year, month, day] = match.date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, Number(hour) - Number(offset), Number(minute)))
}

export const isWithinPrematchWindow = (match, now = new Date(), windowHours = DEFAULT_WINDOW_HOURS) => {
  const msUntilKickoff = kickoffDate(match).getTime() - now.getTime()

  return msUntilKickoff > 0 && msUntilKickoff <= windowHours * 60 * 60 * 1000
}

export const mergeMatchesWithFixturePreviews = (matches, previews) => {
  const previewByMatchId = new Map(previews.map((preview) => [preview.match_id ?? preview.matchId, preview]))

  return matches.map((match) => ({
    ...match,
    insights: normalizeFixturePreview(previewByMatchId.get(match.id)),
  }))
}

export const getPrematchPreviewJobMatches = (matches, now = new Date(), windowHours = DEFAULT_WINDOW_HOURS) =>
  matches.filter((match) => isWithinPrematchWindow(match, now, windowHours))
