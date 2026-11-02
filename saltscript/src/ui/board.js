import { height, width } from '../core/combat.js'
import { inks } from '../core/data.js'

const crackDuration = 450

export const numeral = value => ['0', 'I', 'II', 'III', 'IV'][value] ?? String(value)

export const createBoard = canvas => {
  const ctx = canvas.getContext('2d')
  let box = { cell: 0, left: 0, top: 0 }
  const saltSeen = new Map()
  const stillMotion = matchMedia('(prefers-reduced-motion: reduce)')

  const crackProgress = rune => {
    if (stillMotion.matches) return 1
    if (!saltSeen.has(rune.id)) saltSeen.set(rune.id, performance.now())
    return Math.min(1, (performance.now() - saltSeen.get(rune.id)) / crackDuration)
  }

  const measure = () => {
    const ratio = devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    const cell = Math.min(rect.width / width, rect.height / height)
    box = { cell, left: (rect.width - cell * width) / 2, top: (rect.height - cell * height) / 2, rect }
  }

  const center = i => [box.left + ((i % width) + 0.5) * box.cell, box.top + (Math.floor(i / width) + 0.5) * box.cell]

  const seal = (x, y, r, rune, lit) => {
    const color = inks[rune.ink].color
    if (rune.ink === 'salt') {
      ctx.fillStyle = 'rgb(217 211 196 / 0.22)'
      ctx.strokeStyle = 'rgb(217 211 196 / 0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      const reach = r * crackProgress(rune)
      ctx.beginPath()
      for (const k of [0, 2, 4]) {
        const a = (Math.PI / 3) * k + Math.PI / 6
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach)
      }
      ctx.stroke()
      ctx.fillStyle = 'rgb(217 211 196 / 0.85)'
      ctx.font = `${r * 0.6}px 'Alegreya Sans', system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${rune.ttl}`, x, y)
      return
    }
    const glow = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r)
    glow.addColorStop(0, '#ffffffaa')
    glow.addColorStop(0.25, color)
    glow.addColorStop(1, color)
    if (lit) {
      ctx.shadowColor = color
      ctx.shadowBlur = r * 0.8
    }
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgb(0 0 0 / 0.28)'
    ctx.lineWidth = r * 0.12
    ctx.beginPath()
    ctx.arc(x, y, r * 0.78, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#0f1f28'
    ctx.font = `${r * 0.72}px 'IM Fell English SC', Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(numeral(rune.value), x, y + r * 0.04)
  }

  const draw = (combat, path) => {
    measure()
    ctx.clearRect(0, 0, box.rect.width, box.rect.height)
    const r = box.cell * 0.36
    if (path.length > 1) {
      const lead = combat.cells[path[0]]
      ctx.strokeStyle = inks[lead?.ink ?? 'salt'].color
      ctx.globalAlpha = 0.55
      ctx.lineWidth = r * 0.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (const i of path) ctx.lineTo(...center(i))
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    combat.cells.forEach((rune, i) => {
      if (!rune) return
      const lit = path.includes(i)
      const [x, y] = center(i)
      seal(x, y, lit ? r * 1.1 : r, rune, lit)
    })
  }

  const cellAt = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left - box.left
    const y = clientY - rect.top - box.top
    const column = Math.floor(x / box.cell)
    const row = Math.floor(y / box.cell)
    if (column < 0 || row < 0 || column >= width || row >= height) return null
    const i = row * width + column
    const [cx, cy] = center(i)
    const near = Math.hypot(clientX - rect.left - cx, clientY - rect.top - cy) < box.cell * 0.44
    return near ? i : null
  }

  const pointFor = i => {
    const rect = canvas.getBoundingClientRect()
    const [x, y] = center(i)
    return [rect.left + x, rect.top + y]
  }

  return { draw, cellAt, pointFor }
}
