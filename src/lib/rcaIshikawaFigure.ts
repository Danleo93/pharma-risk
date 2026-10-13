export const ISHIKAWA_FIGURE_WIDTH = 960
export const ISHIKAWA_CARD_WIDTH = 154
export const ISHIKAWA_VISIBLE_CAUSES = 3
export const ISHIKAWA_LABEL_CHARACTERS = 48

type FigureCause = { description: string; is_root_cause: boolean }

export const shortenIshikawaLabel = (description: string) => {
  const text = description.trim().replace(/\s+/g, ' ')
  if (text.length <= ISHIKAWA_LABEL_CHARACTERS) return text
  const wordEnd = text.lastIndexOf(' ', ISHIKAWA_LABEL_CHARACTERS)
  const end = wordEnd >= 32 ? wordEnd : ISHIKAWA_LABEL_CHARACTERS
  return `${text.slice(0, end).trimEnd()}…`
}

export const buildIshikawaFigure = <T extends FigureCause>(branches: { causes: T[] }[], visibleLimit = ISHIKAWA_VISIBLE_CAUSES) => {
  const items = branches.map((branch, index) => {
    const ranked = branch.causes
      .map((cause, position) => ({ cause, position }))
      .sort((left, right) => Number(right.cause.is_root_cause) - Number(left.cause.is_root_cause) || left.position - right.position)
    const selected = new Set(ranked.slice(0, visibleLimit).map(({ position }) => position))
    const visibleCauses = branch.causes.filter((_, position) => selected.has(position))
    const hiddenCount = branch.causes.length - visibleCauses.length
    const shortLabels = visibleCauses.filter((cause) => shortenIshikawaLabel(cause.description) !== cause.description.trim().replace(/\s+/g, ' ')).length
    const xPercent = branches.length === 1 ? 44 : 13 + index * (60 / (branches.length - 1))
    const cardHeight = Math.max(114, 70 + visibleCauses.length * 46 + Math.max(0, visibleCauses.length - 1) * 6 + (hiddenCount ? 30 : 0))

    return {
      index,
      isTop: index % 2 === 0,
      xPercent,
      visibleCauses,
      hiddenCount,
      shortLabels,
      totalCauses: branch.causes.length,
      hasCandidate: branch.causes.some((cause) => cause.is_root_cause),
      cardHeight,
    }
  })

  const topHeight = Math.max(150, ...items.filter((item) => item.isTop).map((item) => item.cardHeight + 20))
  const bottomHeight = Math.max(150, ...items.filter((item) => !item.isTop).map((item) => item.cardHeight + 20))
  const axisY = topHeight + 42
  const bottomStartY = axisY + 56
  const diagramHeight = topHeight + bottomHeight + 126

  return {
    items: items.map((item) => {
      const branchX = ISHIKAWA_FIGURE_WIDTH * item.xPercent / 100
      const cardLeft = Math.max(10, Math.min(
        branchX - ISHIKAWA_CARD_WIDTH / 2,
        ISHIKAWA_FIGURE_WIDTH * 0.83 - ISHIKAWA_CARD_WIDTH - 12,
      ))
      return {
        ...item,
        branchX,
        cardLeft,
        cardCenterX: cardLeft + ISHIKAWA_CARD_WIDTH / 2,
        top: item.isTop ? topHeight - item.cardHeight : bottomStartY,
        branchEndY: item.isTop ? topHeight - 8 : bottomStartY + 8,
      }
    }),
    topHeight,
    bottomHeight,
    axisY,
    diagramHeight,
    hiddenCount: items.reduce((sum, item) => sum + item.hiddenCount, 0),
    shortLabels: items.reduce((sum, item) => sum + item.shortLabels, 0),
  }
}
