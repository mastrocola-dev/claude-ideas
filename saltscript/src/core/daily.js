import { acts } from './data.js'
import { createRun } from './run.js'

const inkMarks = { brine: '🟦', ember: '🟧', moss: '🟩', mixed: '⬜' }
const rowLength = 16

export const dateKey = now => now.toISOString().slice(0, 10)

export const dailySeed = date => {
  let hash = 0
  for (const char of date) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
  return hash % 2 ** 31
}

export const createDailyRun = date => ({ ...createRun(dailySeed(date)), daily: date })

export const startDaily = (meta, date) => ({ ...meta, daily: { date, result: null } })

export const canStartDaily = (meta, date) => meta.daily?.date !== date

export const recordDaily = (meta, run) => {
  const ended = ['victory', 'defeat'].includes(run.screen)
  if (!ended || !run.daily || meta.daily?.date !== run.daily || meta.daily.result) return meta
  const result = {
    won: run.screen === 'victory',
    act: run.actIndex,
    floor: run.floor + 1,
    best: run.stats.best,
    inks: run.stats.inks,
  }
  return { ...meta, daily: { date: run.daily, result } }
}

const english = {
  title: date => `Saltscript Daily Tide ${date}`,
  won: 'The coast remembers',
  place: (act, floor) => `${acts[act].name}, floor ${floor}`,
  best: best => `Greatest glyph: ${best ? `${best.name}, ${best.damage}` : 'none'}`,
}

export const shareText = (date, { won, act, floor, best, inks }, words = english) =>
  [
    words.title(date),
    won ? words.won : words.place(act, floor),
    words.best(best),
    inks
      .slice(-rowLength)
      .map(ink => inkMarks[ink])
      .join(''),
  ].join('\n')
