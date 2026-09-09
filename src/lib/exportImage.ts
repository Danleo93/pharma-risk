import { loadHtmlToImage } from './exportEngines'
import { confirmExportPrivacy, createNeutralExportFileName } from './privacyRuntime'

export const exportElementToPng = async (
  element: HTMLElement | null,
  fileName: string,
) => {
  if (!confirmExportPrivacy()) return
  if (!element) {
    console.warn('Export PNG non disponibile: riferimento elemento assente.')
    return
  }

  const dataUrl = await elementToPngDataUrl(element)
  if (!dataUrl) return

  const link = document.createElement('a')
  link.download = createNeutralExportFileName('GAP', new Date(), 'png', fileName)
  link.href = dataUrl
  link.click()
}

export const elementToPngDataUrl = async (element: HTMLElement | null) => {
  if (!element) {
    console.warn('Export PNG non disponibile: riferimento elemento assente.')
    return null
  }

  const width = Math.max(
    element.scrollWidth,
    element.offsetWidth,
    Math.ceil(element.getBoundingClientRect().width),
  )
  const height = Math.max(
    element.scrollHeight,
    element.offsetHeight,
    Math.ceil(element.getBoundingClientRect().height),
  )

  const { toPng } = await loadHtmlToImage()

  return toPng(element, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: 'none',
    },
  })
}
