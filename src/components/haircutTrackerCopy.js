export const CUT_THRESHOLD = 5

export function getHaircutPunchline(winsInARow) {
  if (winsInARow >= CUT_THRESHOLD) {
    return 'Woohoo, time for a cut.'
  }

  const punchlines = {
    0: 'Forget about the cut.',
    1: "That's a start.",
    2: "Now we're talking.",
    3: 'The barber is watching.',
    4: "One more and it's chair time.",
  }

  return punchlines[winsInARow] ?? punchlines[0]
}

export function buildHaircutShareText(team) {
  const teamLabel = team.flag ? `${team.team} ${team.flag}` : team.team
  const punchline = getHaircutPunchline(team.winsInARow).replace(/\.$/, '')

  if (team.canCutHair) {
    return `Haircut tracker: ${teamLabel} at ${team.winsInARow}/${CUT_THRESHOLD} wins. ${punchline}!! check it out here:`
  }

  return `Haircut tracker: ${teamLabel} at ${team.winsInARow}/${CUT_THRESHOLD} wins. ${punchline}!! check it out here:`
}
