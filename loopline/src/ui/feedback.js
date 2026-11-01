let audio
let muted = false

const tone = (frequency, duration, type = 'sine', delay = 0, to = frequency) => {
  if (muted || !globalThis.AudioContext) return
  audio ??= new AudioContext()
  const start = audio.currentTime + delay
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  osc.frequency.exponentialRampToValueAtTime(to, start + duration)
  gain.gain.setValueAtTime(0.18, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration)
}

const buzz = pattern => {
  if (!muted) globalThis.navigator?.vibrate?.(pattern)
}

export const setMuted = value => {
  muted = value
}

export const feedback = {
  tap: () => {
    tone(1200, 0.03, 'square')
    buzz(6)
  },
  slide: () => tone(420, 0.12, 'triangle', 0, 780),
  blocked: () => {
    tone(140, 0.12, 'square')
    buzz([20, 30, 20])
  },
  clear: () => {
    for (const [i, f] of [660, 880, 1100].entries()) tone(f, 0.12, 'triangle', i * 0.06)
    buzz(25)
  },
  win: () => {
    for (const [i, f] of [523, 659, 784, 1047].entries()) tone(f, 0.2, 'sine', i * 0.1)
    buzz([30, 40, 60])
  },
  lose: () => {
    for (const [i, f] of [330, 247, 165].entries()) tone(f, 0.22, 'sawtooth', i * 0.12)
    buzz(120)
  },
}
