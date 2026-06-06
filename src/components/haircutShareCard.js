import { CUT_THRESHOLD, getHaircutPunchline } from './haircutTrackerCopy'

const WIDTH = 1200
const HEIGHT = 630

const colors = {
  background: '#3d405b',
  card: '#595b76',
  cardBorder: '#6f718c',
  cream: '#f4f1de',
  apricot: '#f2cc8f',
  teal: '#81b29a',
  ink: '#171923',
}

const drawRoundRect = (context, x, y, width, height, radius) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

const fitText = (context, text, maxWidth, startSize, weight = 900) => {
  let size = startSize

  while (size > 28) {
    context.font = `${weight} ${size}px Inter, Arial, sans-serif`
    if (context.measureText(text).width <= maxWidth) {
      return size
    }
    size -= 4
  }

  return size
}

const teamMark = (team) => team.flag || team.team.slice(0, 2).toUpperCase()

export const createHaircutShareCard = (team) =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const context = canvas.getContext('2d')

    if (!context) {
      resolve(null)
      return
    }

    context.fillStyle = colors.background
    context.fillRect(0, 0, WIDTH, HEIGHT)

    drawRoundRect(context, 28, 28, WIDTH - 56, HEIGHT - 56, 28)
    context.fillStyle = colors.card
    context.fill()
    context.strokeStyle = colors.cardBorder
    context.lineWidth = 4
    context.stroke()

    context.textBaseline = 'middle'
    context.fillStyle = colors.cream
    context.font = '900 72px Inter, Arial, sans-serif'
    context.fillText(teamMark(team), 96, 138)

    context.fillStyle = colors.cream
    const titleSize = fitText(context, team.team, 560, 72)
    context.font = `900 ${titleSize}px Inter, Arial, sans-serif`
    context.fillText(team.team, 182, 138)

    drawRoundRect(context, 830, 78, 280, 96, 16)
    context.fillStyle = team.canCutHair ? colors.teal : colors.cream
    context.fill()
    context.fillStyle = colors.ink
    context.font = '900 44px Inter, Arial, sans-serif'
    context.textAlign = 'center'
    context.fillText(team.canCutHair ? 'ELIGIBLE' : `${CUT_THRESHOLD - team.winsInARow} TO GO`, 970, 128)
    context.textAlign = 'left'

    context.fillStyle = colors.cream
    context.font = '700 54px Inter, Arial, sans-serif'
    context.fillText(`Group ${team.group}`, 96, 238)

    drawRoundRect(context, 96, 340, 1008, 30, 15)
    context.fillStyle = 'rgba(244, 241, 222, 0.25)'
    context.fill()
    drawRoundRect(context, 96, 340, Math.max(30, Math.min(team.winsInARow, CUT_THRESHOLD) * 201.6), 30, 15)
    context.fillStyle = colors.apricot
    context.fill()

    context.fillStyle = colors.cream
    context.font = '900 58px Inter, Arial, sans-serif'
    context.fillText(`${team.winsInARow}/${CUT_THRESHOLD} wins in a row`, 96, 462)

    context.fillStyle = colors.apricot
    context.font = '800 38px Inter, Arial, sans-serif'
    context.fillText(getHaircutPunchline(team.winsInARow), 96, 540)

    context.fillStyle = colors.cream
    context.font = '800 28px Inter, Arial, sans-serif'
    context.fillText('wc-fans.vercel.app', 96, 592)

    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null)
        return
      }

      resolve(new File([blob], `${team.team.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-haircut-tracker.png`, {
        type: 'image/png',
      }))
    }, 'image/png')
  })
