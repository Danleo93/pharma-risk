// src/services/gdprExport.ts
import { supabase } from '../lib/supabase'

export async function exportUserDataGDPR(userId: string, userEmail: string) {
  try {
    // Assessment dell'utente
    const { data: assessments } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('user_id', userId)

    // Rischi dell'utente
    const { data: riskItems } = await supabase
      .from('risk_items')
      .select(`
        *,
        risk_catalog_base (name, category, description)
      `)
      .eq('user_id', userId)

    // Azioni correttive dell'utente
    const { data: actions } = await supabase
      .from('action_plans')
      .select('*')
      .eq('user_id', userId)

    // Impostazioni utente
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Costruisci l'oggetto export
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        format_version: '1.0',
        application: 'PhaRMA T - Pharmacy Risk Management Assessment Tool',
      },
      user: {
        email: userEmail,
        facility_name: settings?.facility_name || null,
      },
      assessments:
        assessments?.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          status: a.status,
          created_at: a.created_at,
          updated_at: a.updated_at,
        })) || [],
      risk_items:
        riskItems?.map((r: any) => ({
          id: r.id,
          assessment_id: r.assessment_id,
          risk_name: r.risk_catalog_base?.name || r.custom_risk_name,
          category: r.risk_catalog_base?.category || 'Personalizzato',
          severity: r.severity,
          probability: r.probability,
          detectability: r.detectability,
          rpn: r.rpn,
          risk_class: r.risk_class,
          notes: r.notes,
          created_at: r.created_at,
        })) || [],
      action_plans:
        actions?.map((a: any) => ({
          id: a.id,
          risk_item_id: a.risk_item_id,
          description: a.description,
          responsible: a.responsible,
          due_date: a.due_date,
          status: a.status,
          notes: a.notes,
          created_at: a.created_at,
        })) || [],
      statistics: {
        total_assessments: assessments?.length || 0,
        total_risks: riskItems?.length || 0,
        total_actions: actions?.length || 0,
        high_risks:
          (riskItems?.filter((r: any) => r.risk_class === 'Alta').length ||
            0),
        medium_risks:
          (riskItems?.filter((r: any) => r.risk_class === 'Media').length ||
            0),
        low_risks:
          (riskItems?.filter((r: any) => r.risk_class === 'Bassa').length ||
            0),
      },
    }

    // Crea e scarica il file JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `PhaRMA_T_export_dati_${new Date()
      .toISOString()
      .split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Errore export GDPR:', error)
    return { success: false, error }
  }
}

