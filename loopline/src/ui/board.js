import { dirs, isFree } from '../core/game.js'

const slideTime = 220
const shakeTime = 260
const ease = t => 1 - (1 - t) ** 3

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export const createBoard = canvas => {
  const ctx = canvas.getContext('2d')
  let box = {}

  const measure = size => {
    const ratio = devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * ratio
    canvas.height = height * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    const side = Math.min(width, height)
    const track = side * 0.11
    const inset = track * 1.35
    box = {
      width,
      height,
      side,
      track,
      left: (width - side) / 2,
      top: (height - side) / 2,
      inset,
      cell: (side - inset * 2) / size,
    }
  }

  const cellCenter = (x, y) => [box.left + box.inset + (x + 0.5) * box.cell, box.top + box.inset + (y + 0.5) * box.cell]

  const ringPoint = s => {
    const edge = box.side - box.track
    const p = ((s % (edge * 4)) + edge * 4) % (edge * 4)
    const x0 = box.left + box.track / 2
    const y0 = box.top + box.track / 2
    if (p < edge) return [x0 + p, y0]
    if (p < edge * 2) return [x0 + edge, y0 + p - edge]
    if (p < edge * 3) return [x0 + edge - (p - edge * 2), y0 + edge]
    return [x0, y0 + edge - (p - edge * 3)]
  }

  const exitPoint = tile => {
    const [dx, dy] = dirs[tile.dir]
    const [cx, cy] = cellCenter(tile.x, tile.y)
    const mid = box.track / 2
    if (dx > 0) return [box.left + box.side - mid, cy]
    if (dx < 0) return [box.left + mid, cy]
    if (dy > 0) return [cx, box.top + box.side - mid]
    return [cx, box.top + mid]
  }

  const drawTile = (cx, cy, size, color, dir, alpha = 1) => {
    const half = size / 2
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    roundRect(ctx, cx - half, cy - half, size, size, size * 0.22)
    ctx.fill()
    ctx.fillStyle = 'rgb(0 0 0 / 0.18)'
    roundRect(ctx, cx - half, cy + half * 0.55, size, half * 0.45, [0, 0, size * 0.22, size * 0.22])
    ctx.fill()
    if (dir) {
      const [dx, dy] = dirs[dir]
      const a = size * 0.2
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = Math.max(2, size * 0.09)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - dx * a - dy * a, cy - dy * a - dx * a)
      ctx.lineTo(cx + dx * a, cy + dy * a)
      ctx.lineTo(cx - dx * a + dy * a, cy - dy * a + dx * a)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const drawTrack = (state, time) => {
    const danger = state.belt.length >= state.capacity - 1
    ctx.strokeStyle = danger ? '#5c2346' : '#2c2560'
    ctx.lineWidth = box.track
    roundRect(
      ctx,
      box.left + box.track / 2,
      box.top + box.track / 2,
      box.side - box.track,
      box.side - box.track,
      box.track * 0.6,
    )
    ctx.stroke()
    const spacing = ((box.side - box.track) * 4) / state.capacity
    const offset = time * 0.03
    for (let i = 0; i < state.capacity; i++) {
      const [x, y] = ringPoint(offset + i * spacing)
      const color = state.belt[i]
      if (color) drawTile(x, y, box.track * 0.78, color)
      else {
        ctx.strokeStyle = danger ? '#a3416f' : '#4a4380'
        ctx.lineWidth = 2
        roundRect(ctx, x - box.track * 0.3, y - box.track * 0.3, box.track * 0.6, box.track * 0.6, box.track * 0.15)
        ctx.stroke()
      }
    }
  }

  const draw = (state, effects, time) => {
    measure(state.size)
    ctx.clearRect(0, 0, box.width, box.height)
    drawTrack(state, time)
    const tileSize = box.cell * 0.86
    for (const tile of state.tiles) {
      const shake = effects.find(e => e.kind === 'shake' && e.tile.x === tile.x && e.tile.y === tile.y)
      const [cx, cy] = cellCenter(tile.x, tile.y)
      const wobble = shake
        ? Math.sin((time - shake.at) / 25) * box.cell * 0.06 * (1 - (time - shake.at) / shakeTime)
        : 0
      const free = isFree(state.size, state.tiles, tile)
      drawTile(cx + wobble, cy, tileSize, tile.color, tile.dir, free ? 1 : 0.72)
    }
    for (const effect of effects.filter(e => e.kind === 'slide')) {
      const t = ease(Math.min(1, (time - effect.at) / slideTime))
      const [fx, fy] = cellCenter(effect.tile.x, effect.tile.y)
      const [tx, ty] = exitPoint(effect.tile)
      drawTile(
        fx + (tx - fx) * t,
        fy + (ty - fy) * t,
        tileSize * (1 - t * 0.3),
        effect.tile.color,
        effect.tile.dir,
        1 - t * 0.4,
      )
    }
  }

  const cellAt = (px, py, size) => {
    const x = Math.floor((px - box.left - box.inset) / box.cell)
    const y = Math.floor((py - box.top - box.inset) / box.cell)
    return x >= 0 && y >= 0 && x < size && y < size ? [x, y] : null
  }

  const expired = (effect, time) => time - effect.at > (effect.kind === 'slide' ? slideTime : shakeTime)

  return { draw, cellAt, expired, cellCenter }
}
