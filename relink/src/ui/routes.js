import { openLanes } from '../core/run.js'

const svgNs = 'http://www.w3.org/2000/svg'

const routeClass = (run, open, floor, lane, target) => {
  if (run.trail[floor] === lane && run.trail[floor + 1] === target) return 'walked'
  const live = run.trail[floor] === lane || open[floor].includes(lane)
  return live && open[floor + 1].includes(target) ? 'ahead' : 'lost'
}

export const drawRoutes = (svg, list, run) => {
  const origin = svg.getBoundingClientRect()
  const open = openLanes(run)
  const anchor = (floor, lane) => {
    const rect = list.children[floor].querySelector(`[data-lane="${lane}"]`).getBoundingClientRect()
    return { x: rect.left + rect.width / 2 - origin.left, top: rect.top - origin.top, bottom: rect.bottom - origin.top }
  }
  const lines = run.map.flatMap((nodes, floor) =>
    nodes.flatMap(node =>
      node.links.map(target => {
        const from = anchor(floor, node.lane)
        const to = anchor(floor + 1, target)
        const line = document.createElementNS(svgNs, 'line')
        line.setAttribute('x1', from.x)
        line.setAttribute('y1', from.top)
        line.setAttribute('x2', to.x)
        line.setAttribute('y2', to.bottom)
        line.setAttribute('class', routeClass(run, open, floor, node.lane, target))
        line.dataset.floor = floor
        return line
      }),
    ),
  )
  svg.replaceChildren(...lines)
}
