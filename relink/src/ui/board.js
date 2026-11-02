import { height, width } from '../core/combat.js'
import { inks } from '../core/data.js'

const scanDuration = 450
const fallBase = 180
const fallPerRow = 70
const settle = t => {
  const eased = 1 - (1 - t) ** 3
  return t < 1 ? eased + Math.sin(t * Math.PI) * 0.06 : 1
}
const void_ = '#07080f'

export const numeral = value => String(value)

export const createBoard = canvas => {
  const ctx = canvas.getContext('2d')
  let box = { cell: 0, left: 0, top: 0 }
  const glitchSeen = new Map()
  const places = new Map()
  const stillMotion = matchMedia('(prefers-reduced-motion: reduce)')

  const scanProgress = rune => {
    if (stillMotion.matches) return 1
    if (!glitchSeen.has(rune.id)) glitchSeen.set(rune.id, performance.now())
    return Math.min(1, (performance.now() - glitchSeen.get(rune.id)) / scanDuration)
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

  const at = (column, row) => [box.left + (column + 0.5) * box.cell, box.top + (row + 0.5) * box.cell]

  const track = (cells, now) => {
    const arriving = Array(width).fill(0)
    for (const [i, rune] of cells.entries()) {
      if (rune && !places.has(rune.id)) arriving[i % width] += 1
    }
    const present = new Set()
    for (const [i, rune] of cells.entries()) {
      if (!rune) continue
      present.add(rune.id)
      const column = i % width
      const row = Math.floor(i / width)
      const place = places.get(rune.id)
      if (!place) {
        places.set(rune.id, { from: [column, row - arriving[column]], to: [column, row], start: now })
        continue
      }
      if (place.to[0] === column && place.to[1] === row) continue
      places.set(rune.id, { from: position(place, now), to: [column, row], start: now })
    }
    for (const id of places.keys()) if (!present.has(id)) places.delete(id)
  }

  const position = (place, now) => {
    if (stillMotion.matches) return place.to
    const rows = Math.hypot(place.to[0] - place.from[0], place.to[1] - place.from[1])
    const t = Math.min(1, (now - place.start) / (fallBase + fallPerRow * rows))
    const k = settle(t)
    return [place.from[0] + (place.to[0] - place.from[0]) * k, place.from[1] + (place.to[1] - place.from[1]) * k]
  }

  const plate = (x, y, r) => {
    ctx.beginPath()
    ctx.roundRect(x - r, y - r, r * 2, r * 2, r * 0.32)
  }

  const label = (text, x, y, size, color, family) => {
    ctx.fillStyle = color
    ctx.font = `600 ${size}px ${family}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
  }

  const glitch = (x, y, r, rune) => {
    const seed = [...rune.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const reach = scanProgress(rune)
    plate(x, y, r)
    ctx.fillStyle = 'rgb(201 195 214 / 0.1)'
    ctx.fill()
    ctx.strokeStyle = 'rgb(201 195 214 / 0.45)'
    ctx.setLineDash([r * 0.2, r * 0.14])
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgb(201 195 214 / 0.35)'
    for (let line = 0; line < 7; line++) {
      const offset = ((seed * (line + 3)) % 11) / 11
      const row = y - r + (line + 0.5) * ((r * 2) / 7)
      ctx.fillRect(x - r + offset * r * 0.6, row, r * (0.6 + offset) * reach, 2)
    }
    label(`${rune.ttl}`, x, y, r * 0.62, 'rgb(233 236 255 / 0.9)', "'IBM Plex Sans', system-ui, sans-serif")
  }

  const cell = (x, y, r, rune, lit) => {
    if (rune.ink === 'glitch') return glitch(x, y, r, rune)
    const color = inks[rune.ink].color
    ctx.shadowColor = color
    ctx.shadowBlur = lit ? r * 0.9 : r * 0.35
    plate(x, y, r)
    ctx.fillStyle = lit ? color : void_
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.lineWidth = r * 0.1
    ctx.strokeStyle = color
    ctx.stroke()
    if (!lit) {
      plate(x, y, r * 0.78)
      ctx.fillStyle = `${color}22`
      ctx.fill()
    }
    const ink = lit ? void_ : color
    label(numeral(rune.value), x, y - r * 0.14, r * 0.78, ink, "'Chakra Petch', system-ui, sans-serif")
    label(inks[rune.ink].mark, x, y + r * 0.5, r * 0.36, ink, 'system-ui, sans-serif')
  }

  const draw = (combat, path) => {
    measure()
    const now = performance.now()
    track(combat.cells, now)
    ctx.clearRect(0, 0, box.rect.width, box.rect.height)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, box.top - box.cell * 0.1, box.rect.width, box.cell * (height + 0.2))
    ctx.clip()
    const r = box.cell * 0.34
    if (path.length > 1) {
      const lead = path.map(i => combat.cells[i]).find(rune => rune && rune.ink !== 'glitch')
      const color = inks[lead?.ink ?? 'glitch'].color
      ctx.strokeStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = r * 0.8
      ctx.lineWidth = r * 0.22
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (const i of path) ctx.lineTo(...center(i))
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    combat.cells.forEach((rune, i) => {
      if (!rune) return
      const lit = path.includes(i)
      const [x, y] = at(...position(places.get(rune.id), now))
      cell(x, y, lit ? r * 1.06 : r, rune, lit)
    })
    ctx.restore()
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
