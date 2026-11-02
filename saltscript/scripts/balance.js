import { policies, summarize } from '../src/core/bot.js'

const seeds = Array.from({ length: 50 }, (_, i) => i + 1)
const percent = value => `${Math.round(value * 100)}%`

console.log('| Policy | Act 1 cleared | Full run won | Mean acts cleared | Turns per fight |')
console.log('| --- | --- | --- | --- | --- |')
for (const policy of Object.keys(policies)) {
  const { firstActRate, winRate, actsCleared, turnsPerFight } = summarize(seeds, policy)
  console.log(
    `| ${policy} | ${percent(firstActRate)} | ${percent(winRate)} | ${actsCleared.toFixed(1)} | ${turnsPerFight.toFixed(1)} |`,
  )
}
