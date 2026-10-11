type NamedRiskItem = {
  custom_risk_name?: string | null
  risk_catalog_base?: { name: string } | null
}

export const getFMEARiskName = (risk: NamedRiskItem | null | undefined): string =>
  risk?.custom_risk_name?.trim() || risk?.risk_catalog_base?.name || ''
