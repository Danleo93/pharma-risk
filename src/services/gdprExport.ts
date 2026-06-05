import { supabase } from '../lib/supabase'

type ExportRow = Record<string, unknown>

const toRows = (data: unknown): ExportRow[] => (Array.isArray(data) ? (data as ExportRow[]) : [])

const fetchUserRows = async (table: string, userId: string, select = '*') => {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Errore export tabella ${table}: ${error.message}`)
  }

  return toRows(data)
}

const fetchRowsByIds = async (
  table: string,
  column: string,
  ids: string[],
  select = '*',
  options: { optional?: boolean; warnings?: string[] } = {},
) => {
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in(column, ids)

  if (error) {
    if (options.optional) {
      options.warnings?.push(`Tabella opzionale non esportata (${table}): ${error.message}`)
      return []
    }
    throw new Error(`Errore export tabella ${table}: ${error.message}`)
  }

  return toRows(data)
}

const getIds = (rows: ExportRow[]) => (
  rows
    .map((row) => row.id)
    .filter((value): value is string => typeof value === 'string')
)

const downloadJson = (data: unknown, fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportUserDataGDPR(userId: string, userEmail: string) {
  try {
    const exportedAt = new Date().toISOString()
    const warnings: string[] = []

    const [
      settingsResult,
      fmeaAreas,
      fmeaAssessments,
      userCustomRisks,
      rcaAssessments,
      rcaCauses,
      rcaFishboneDiagrams,
      rcaFishboneBranches,
      rcaFishboneCauses,
      rcaFiveWhyChains,
      rcaFiveWhySteps,
      rcaActionPlans,
      gapProcesses,
      gapAreas,
      gapActivities,
      gapStandards,
      gapActivityStandards,
      gapAssessments,
      gapAssessmentProcesses,
      gapActivityEvaluations,
      gapActions,
      gapActionEvents,
      gapLinks,
    ] = await Promise.all([
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      fetchUserRows('areas', userId),
      fetchUserRows('risk_assessments', userId),
      fetchUserRows('user_custom_risks', userId),
      fetchUserRows('rca_assessments', userId),
      fetchUserRows('rca_causes', userId),
      fetchUserRows('rca_fishbone_diagrams', userId),
      fetchUserRows('rca_fishbone_branches', userId),
      fetchUserRows('rca_fishbone_causes', userId),
      fetchUserRows('rca_five_why_chains', userId),
      fetchUserRows('rca_five_why_steps', userId),
      fetchUserRows('rca_action_plans', userId),
      fetchUserRows('gap_processes', userId),
      fetchUserRows('gap_areas', userId),
      fetchUserRows('gap_activities', userId),
      fetchUserRows('gap_standards', userId),
      fetchUserRows('gap_activity_standards', userId),
      fetchUserRows('gap_assessments', userId),
      fetchUserRows('gap_assessment_processes', userId),
      fetchUserRows('gap_activity_evaluations', userId),
      fetchUserRows('gap_actions', userId),
      fetchUserRows('gap_action_events', userId),
      fetchUserRows('gap_links', userId),
    ])

    if (settingsResult.error) {
      throw new Error(`Errore export impostazioni utente: ${settingsResult.error.message}`)
    }

    const fmeaAssessmentIds = getIds(fmeaAssessments)
    const fmeaProcesses = await fetchRowsByIds('processes', 'area_id', getIds(fmeaAreas))
    const fmeaProcessSteps = await fetchRowsByIds(
      'process_steps',
      'process_id',
      getIds(fmeaProcesses),
      '*',
      { optional: true, warnings },
    )
    const fmeaRiskItems = await fetchRowsByIds(
      'risk_items',
      'assessment_id',
      fmeaAssessmentIds,
      `
        *,
        risk_catalog_base (id, name, category, description)
      `,
    )
    const fmeaRiskItemIds = getIds(fmeaRiskItems)
    const fmeaControlMeasures = await fetchRowsByIds(
      'control_measures',
      'risk_item_id',
      fmeaRiskItemIds,
      '*',
      { optional: true, warnings },
    )
    const fmeaActionPlans = await fetchRowsByIds('action_plans', 'risk_item_id', fmeaRiskItemIds)

    const exportData = {
      export_info: {
        exported_at: exportedAt,
        format_version: '2.0',
        application: 'PhaRMA T - Pharmacy Risk Management Assessment Tool',
        scope: 'Export completo dei dati applicativi associati all account utente',
        modules: ['FMEA', 'RCA', 'Gap Analysis'],
        warnings,
      },
      user: {
        id: userId,
        email: userEmail,
        settings: settingsResult.data || null,
      },
      privacy_notice: {
        intended_use:
          'PhaRMA T e progettata per dati simulati, anonimizzati, aggregati o comunque non identificativi.',
        note:
          'Il file puo contenere testi liberi inseriti dall utente. Deve essere conservato e condiviso con cautela.',
      },
      fmea: {
        areas: fmeaAreas,
        processes: fmeaProcesses,
        process_steps: fmeaProcessSteps,
        assessments: fmeaAssessments,
        risk_items: fmeaRiskItems,
        control_measures: fmeaControlMeasures,
        action_plans: fmeaActionPlans,
        user_custom_risks: userCustomRisks,
      },
      rca: {
        assessments: rcaAssessments,
        causes: rcaCauses,
        fishbone_diagrams: rcaFishboneDiagrams,
        fishbone_branches: rcaFishboneBranches,
        fishbone_causes: rcaFishboneCauses,
        five_why_chains: rcaFiveWhyChains,
        five_why_steps: rcaFiveWhySteps,
        action_plans: rcaActionPlans,
      },
      gap: {
        processes: gapProcesses,
        areas: gapAreas,
        activities: gapActivities,
        standards: gapStandards,
        activity_standards: gapActivityStandards,
        assessments: gapAssessments,
        assessment_processes: gapAssessmentProcesses,
        activity_evaluations: gapActivityEvaluations,
        actions: gapActions,
        action_events: gapActionEvents,
        links: gapLinks,
      },
      statistics: {
        fmea: {
          assessments: fmeaAssessments.length,
          risks: fmeaRiskItems.length,
          actions: fmeaActionPlans.length,
          custom_risks: userCustomRisks.length,
        },
        rca: {
          assessments: rcaAssessments.length,
          causes: rcaCauses.length,
          five_why_chains: rcaFiveWhyChains.length,
          actions: rcaActionPlans.length,
        },
        gap: {
          assessments: gapAssessments.length,
          processes: gapProcesses.length,
          areas: gapAreas.length,
          activities: gapActivities.length,
          standards: gapStandards.length,
          evaluations: gapActivityEvaluations.length,
          actions: gapActions.length,
          action_events: gapActionEvents.length,
        },
      },
    }

    downloadJson(
      exportData,
      `PhaRMA_T_export_GDPR_${new Date().toISOString().split('T')[0]}.json`,
    )

    return { success: true }
  } catch (error) {
    console.error('Errore export GDPR:', error)
    return { success: false, error }
  }
}
