const key = 'loopline.progress'
const empty = { unlocked: 1, stars: {}, muted: false }

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

export const recordWin = (progress, level, stars) =>
  saveProgress({
    ...progress,
    unlocked: Math.max(progress.unlocked, level + 1),
    stars: { ...progress.stars, [level]: Math.max(progress.stars[level] ?? 0, stars) },
  })
