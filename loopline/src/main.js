import { dailyLevel, dayKey, recordDaily, shareText } from './core/daily.js'
import { canTap, createGame, reverse, stars, tap, undo, widen } from './core/game.js'
import { levelFor } from './core/levels.js'
import { createBoard } from './ui/board.js'
import { feedback, setMuted } from './ui/feedback.js'
import { boosterKinds, loadProgress, recordWin, saveProgress, spendBooster } from './ui/progress.js'

const $ = id => document.getElementById(id)
const canvas = $('board')
const board = createBoard(canvas)
const boosterIcons = { undo: '↶', widen: '＋', reverse: '⇄' }
const boosterRules = { undo, widen, reverse }

let progress = loadProgress()
let level
let state
let effects = []

const show = screen => {
  for (const id of ['title', 'levels', 'game', 'result'])
    $(id).hidden = id !== screen && !(screen === 'result' && id === 'game')
}

const renderBins = (previous = state.bins) => {
  $('bins').replaceChildren(
    ...state.bins.map((bin, i) => {
      const el = document.createElement('div')
      el.className = bin.color ? 'bin' : 'bin empty'
      if (bin.color) el.style.setProperty('--bin', bin.color)
      el.replaceChildren(
        ...[0, 1, 2].map(n => Object.assign(document.createElement('i'), { className: n < bin.fill ? 'on' : '' })),
      )
      if (previous[i].color !== bin.color || previous[i].fill !== bin.fill) {
        el.classList.add('pulse')
        setTimeout(() => el.classList.remove('pulse'), 160)
      }
      return el
    }),
  )
}

const burst = (el, color) => {
  const { left, top, width, height } = el.getBoundingClientRect()
  for (let i = 0; i < 10; i++) {
    const spark = document.createElement('i')
    spark.className = 'spark'
    spark.style.cssText = `left:${left + width / 2}px;top:${top + height / 2}px;--a:${i * 36}deg;--c:${color}`
    document.body.append(spark)
    setTimeout(() => spark.remove(), 600)
  }
}

const quake = () => {
  $('game').classList.add('quake')
  setTimeout(() => $('game').classList.remove('quake'), 400)
}

const renderHud = () => {
  $('level-label').textContent = level.day ? 'Daily Loop' : `Level ${level.number}`
  for (const kind of boosterKinds) {
    const count = progress.boosters[kind]
    $(kind).textContent = `${boosterIcons[kind]} ${count}`
    $(kind).disabled = !count || state.status !== 'playing' || (kind === 'undo' && !state.history.length)
  }
  $('hint').textContent = level.hint ?? `Loop holds ${state.capacity}. Don't let it overflow.`
}

const begin = built => {
  level = built
  state = createGame(level)
  effects = []
  renderBins()
  renderHud()
  show('game')
  board.draw(state, effects, performance.now())
}

const start = number => begin(levelFor(number))

const finish = () => {
  const won = state.status === 'won'
  const earned = won ? stars(state) : 0
  if (level.day) {
    const result = { won, moves: state.moves, stars: earned }
    progress = saveProgress({ ...progress, daily: recordDaily(progress.daily, level.day, result) })
  } else if (won) progress = recordWin(progress, level.number, earned)
  feedback[won ? 'win' : 'lose']()
  if (!won) quake()
  setTimeout(() => {
    $('result-title').textContent = won ? 'Loop cleared!' : 'Loop overflowed'
    $('result-stars').textContent = won ? '★'.repeat(earned) + '☆'.repeat(3 - earned) : ''
    $('result-next').textContent = won ? (level.day ? 'Done' : 'Next level') : 'Try again'
    $('result-next').onclick = () => {
      if (!won) begin(level)
      else if (level.day) showTitle()
      else start(level.number + 1)
    }
    $('result-share').hidden = !level.day
    $('result-share').textContent = 'Share'
    show('result')
  }, 450)
}

const play = (x, y) => {
  if (!canTap(state, x, y)) {
    effects.push({ kind: 'shake', tile: { x, y }, at: performance.now() })
    if (state.status === 'playing') feedback.blocked()
    return
  }
  const before = state.bins
  const next = tap(state, x, y)
  effects.push({ kind: 'slide', tile: next.last, at: performance.now() })
  feedback.tap()
  setTimeout(feedback.slide, 60)
  if (next.cleared.length) setTimeout(feedback.clear, 120)
  state = next
  renderBins(before)
  for (const [i, bin] of before.entries())
    if (bin.color && bin.color !== state.bins[i].color) burst($('bins').children[i], bin.color)
  renderHud()
  if (state.status !== 'playing') finish()
}

canvas.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect()
  const cell = board.cellAt(event.clientX - rect.left, event.clientY - rect.top, state.size)
  if (cell) play(...cell)
})

const renderLevels = () => {
  $('level-grid').replaceChildren(
    ...Array.from({ length: Math.max(30, progress.unlocked + 10) }, (_, i) => {
      const n = i + 1
      const button = document.createElement('button')
      button.disabled = n > progress.unlocked
      button.innerHTML = `${n}<small>${'★'.repeat(progress.stars[n] ?? 0)}</small>`
      button.onclick = () => start(n)
      return button
    }),
  )
}

const renderSound = () => {
  setMuted(progress.muted)
  $('sound').textContent = progress.muted ? 'Sound off' : 'Sound on'
}

const showTitle = () => {
  const { streak } = progress.daily
  $('daily').textContent = streak ? `Daily Loop 🔥${streak}` : 'Daily Loop'
  show('title')
}

const share = async () => {
  const text = shareText(level, progress.daily)
  try {
    if (navigator.share) await navigator.share({ text })
    else {
      await navigator.clipboard.writeText(text)
      $('result-share').textContent = 'Copied'
    }
  } catch {}
}

$('result-share').onclick = share
$('daily').onclick = () => begin(dailyLevel(dayKey(new Date())))
$('play').onclick = () => start(progress.unlocked)
$('choose').onclick = () => {
  renderLevels()
  show('levels')
}
$('back').onclick = showTitle
$('home').onclick = showTitle
$('result-menu').onclick = showTitle
$('restart').onclick = () => begin(level)
for (const kind of boosterKinds) {
  $(kind).onclick = () => {
    if (!progress.boosters[kind] || state.status !== 'playing') return
    progress = spendBooster(progress, kind)
    state = boosterRules[kind](state)
    renderBins()
    renderHud()
  }
}
$('sound').onclick = () => {
  progress = saveProgress({ ...progress, muted: !progress.muted })
  renderSound()
}

const frame = time => {
  if (state && !$('game').hidden) {
    effects = effects.filter(e => !board.expired(e, time))
    board.draw(state, effects, time)
  }
  requestAnimationFrame(frame)
}

renderSound()
showTitle()
requestAnimationFrame(frame)

window.loopline = {
  level: () => level,
  status: () => state?.status,
  pointFor: (x, y) => {
    const rect = canvas.getBoundingClientRect()
    const [cx, cy] = board.cellCenter(x, y)
    return [rect.left + cx, rect.top + cy]
  },
}
