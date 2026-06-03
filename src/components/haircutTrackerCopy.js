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
  const punchline = getHaircutPunchline(team.winsInARow)

  if (team.canCutHair) {
    return `${team.team} just hit ${team.winsInARow} straight wins. ${punchline} Track it on WCFans.`
  }

  return `${team.team} is at ${team.winsInARow}/${CUT_THRESHOLD} wins. ${punchline} Track it on WCFans.`
}
