import { levelFrom, palette, paramsFor } from './levels.js'

const squares = ['🟥', '🟨', '🟩', '🟦', '🟪', '🟧']
const ring = [0, 1, 2, 5, 8, 7, 6, 3]
const day = 86400000

export const dayKey = date => date.toISOString().slice(0, 10)

const seedOf = key => [...key].reduce((hash, c) => Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)

export const dailyLevel = key => ({
  ...levelFrom(paramsFor(20), seedOf(key)),
  number: 'daily',
  day: key,
  hint: 'Same loop for everyone today. One attempt counts.',
})

export const recordDaily = (daily, key, result) => {
  if (daily.last?.day === key) return daily
  const yesterday = dayKey(new Date(Date.parse(key) - day))
  const kept = daily.last?.day === yesterday && daily.last.won ? daily.streak : 0
  return { streak: result.won ? kept + 1 : 0, last: { day: key, ...result } }
}

export const shareText = (level, daily) => {
  const { day: key, won, moves, stars } = daily.last
  const cells = Array.from({ length: 9 }, () => (won ? '✅' : '❌'))
  for (const [i, cell] of ring.entries()) cells[cell] = squares[palette.indexOf(level.queue[i % level.queue.length])]
  return [
    `Loopline Daily ${key}`,
    cells.slice(0, 3).join(''),
    cells.slice(3, 6).join(''),
    cells.slice(6).join(''),
    `${moves} moves ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}`,
    `🔥 ${daily.streak}`,
  ].join('\n')
}
