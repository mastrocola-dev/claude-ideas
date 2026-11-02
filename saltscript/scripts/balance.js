import { policies, summarize } from '../src/core/bot.js'

const seeds = Array.from({ length: 50 }, (_, i) => i + 1)
const percent = value => `${Math.round(value * 100)}%`

console.log('| Policy | Win rate | Mean floor | Turns per fight |')
console.log('| --- | --- | --- | --- |')
for (const policy of Object.keys(policies)) {
  const { winRate, floor, turnsPerFight } = summarize(seeds, policy)
  console.log(`| ${policy} | ${percent(winRate)} | ${floor.toFixed(1)} | ${turnsPerFight.toFixed(1)} |`)
}
