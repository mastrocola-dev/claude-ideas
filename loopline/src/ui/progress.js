const key = 'loopline.progress'
export const boosterKinds = ['undo', 'widen', 'reverse']

const empty = {
  unlocked: 1,
  stars: {},
  muted: false,
  boosters: { undo: 3, widen: 1, reverse: 1 },
  daily: { streak: 0 },
}

const totalStars = stars => Object.values(stars).reduce((sum, n) => sum + n, 0)

export const loadProgress = () => {
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(key)) }
  } catch {
    return { ...empty }
  }
}

export const saveProgress = progress => {
  try {
    localStorage.setItem(key, JSON.stringify(progress))
  } catch {}
  return progress
}

export const recordWin = (progress, level, earned) => {
  const stars = { ...progress.stars, [level]: Math.max(progress.stars[level] ?? 0, earned) }
  const boosters = { ...progress.boosters }
  for (let n = totalStars(progress.stars); n < totalStars(stars); n++) boosters[boosterKinds[n % 3]] += 1
  return saveProgress({ ...progress, unlocked: Math.max(progress.unlocked, level + 1), stars, boosters })
}

export const spendBooster = (progress, kind) =>
  saveProgress({ ...progress, boosters: { ...progress.boosters, [kind]: progress.boosters[kind] - 1 } })
