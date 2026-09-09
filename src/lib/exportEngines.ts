export type XlsxEngine = typeof import('xlsx')
export type HtmlToImageEngine = typeof import('html-to-image')
export type PdfAutoTable = typeof import('jspdf-autotable').default

export interface PdfEngine {
  jsPDF: typeof import('jspdf').default
  autoTable: PdfAutoTable
}

let xlsxPromise: Promise<XlsxEngine> | null = null
let pdfEnginePromise: Promise<PdfEngine> | null = null
let htmlToImagePromise: Promise<HtmlToImageEngine> | null = null

export const loadXlsx = () => {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx').catch((error) => {
      xlsxPromise = null
      throw error
    })
  }

  return xlsxPromise
}

export const loadPdfEngine = () => {
  if (!pdfEnginePromise) {
    pdfEnginePromise = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
      .then(([jsPdfModule, autoTableModule]) => ({
        jsPDF: jsPdfModule.default,
        autoTable: autoTableModule.default,
      }))
      .catch((error) => {
        pdfEnginePromise = null
        throw error
      })
  }

  return pdfEnginePromise
}

export const loadHtmlToImage = () => {
  if (!htmlToImagePromise) {
    htmlToImagePromise = import('html-to-image').catch((error) => {
      htmlToImagePromise = null
      throw error
    })
  }

  return htmlToImagePromise
}
