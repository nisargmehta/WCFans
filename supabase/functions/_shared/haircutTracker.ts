export const getCurrentWinStreak = (form: string | null) => {
  if (!form) {
    return 0
  }

  // football-data orders form from newest to oldest (for example, "W,D").
  const results = form.toUpperCase().match(/[WDL]/g) ?? []
  let streak = 0

  for (const result of results) {
    if (result !== 'W') {
      break
    }

    streak += 1
  }

  return streak
}
