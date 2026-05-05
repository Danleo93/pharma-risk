import { toPng } from 'html-to-image'

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120) || 'export'

export const exportElementToPng = async (
  element: HTMLElement | null,
  fileName: string,
) => {
  if (!element) {
    console.warn('Export PNG non disponibile: riferimento elemento assente.')
    return
  }

  const dataUrl = await elementToPngDataUrl(element)
  if (!dataUrl) return

  const link = document.createElement('a')
  link.download = `${sanitizeFileName(fileName)}.png`
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
