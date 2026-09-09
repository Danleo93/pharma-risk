import {
  assertLocalEnvironment,
  makeUuid,
  printResult,
  seededId,
  signInSyntheticUser,
  STATUS,
  summarizeStatuses,
  USERS,
  writeResult,
} from './lib.mjs'

const [USER_A, USER_B] = USERS
const uid = (user) => user.id
const sid = (prefix, user) => seededId(prefix, user)
const tag = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const tables = [
  { module: 'FMEA', table: 'areas', prefix: '20', direct: (u, id, t) => ({ id, user_id: uid(u), name: `Area security ${t}` }) },
  {
    module: 'FMEA', table: 'processes', prefix: '21',
    direct: (u, id, t) => ({ id, user_id: uid(u), area_id: sid('20', u), name: `Processo security ${t}` }),
    cross: (actor, other, id, t) => ({ id, user_id: uid(actor), area_id: sid('20', other), name: `Processo cross ${t}` }),
  },
  {
    module: 'FMEA', table: 'process_steps', prefix: '22',
    direct: (u, id, t) => ({ id, process_id: sid('21', u), step_number: 7000 + Number(u.suffix), name: `Fase security ${t}` }),
    cross: (_actor, other, id, t) => ({ id, process_id: sid('21', other), step_number: 7100 + Number(other.suffix), name: `Fase cross ${t}` }),
  },
  {
    module: 'FMEA', table: 'risk_assessments', prefix: '23',
    direct: (u, id, t) => ({ id, user_id: uid(u), area_id: sid('20', u), process_id: sid('21', u), title: `FMEA security ${t}`, status: 'draft' }),
    cross: (actor, other, id, t) => [
      { label: 'area e processo', payload: { id, user_id: uid(actor), area_id: sid('20', other), process_id: sid('21', other), title: `FMEA cross ${t}`, status: 'draft' } },
      { label: 'sola area', payload: { id, user_id: uid(actor), area_id: sid('20', other), process_id: sid('21', actor), title: `FMEA area cross ${t}`, status: 'draft' } },
      { label: 'solo processo', payload: { id, user_id: uid(actor), area_id: sid('20', actor), process_id: sid('21', other), title: `FMEA processo cross ${t}`, status: 'draft' } },
    ],
  },
  { module: 'FMEA', table: 'risk_catalog_base', prefix: '24', shared: true },
  { module: 'FMEA', table: 'risk_catalog_user', prefix: '241', direct: (u, id, t) => ({ id, user_id: uid(u), category: 'Security', name: `Catalogo security ${t}` }) },
  {
    module: 'FMEA', table: 'risk_items', prefix: '25',
    direct: (u, id, t) => ({ id, assessment_id: sid('23', u), process_step_id: sid('22', u), risk_catalog_user_id: sid('241', u), custom_risk_name: `Rischio security ${t}`, severity: 2, probability: 2, detectability: 2 }),
    cross: (actor, other, id, t) => [
      { label: 'assessment root', payload: { id, assessment_id: sid('23', other), process_step_id: sid('22', other), risk_catalog_user_id: sid('241', other), custom_risk_name: `Rischio cross ${t}`, severity: 2, probability: 2, detectability: 2 } },
      { label: 'process step', payload: { id, assessment_id: sid('23', actor), process_step_id: sid('22', other), risk_catalog_user_id: sid('241', actor), custom_risk_name: `Rischio step cross ${t}`, severity: 2, probability: 2, detectability: 2 } },
      { label: 'catalogo utente', payload: { id, assessment_id: sid('23', actor), process_step_id: sid('22', actor), risk_catalog_user_id: sid('241', other), custom_risk_name: `Rischio catalogo cross ${t}`, severity: 2, probability: 2, detectability: 2 } },
    ],
  },
  {
    module: 'FMEA', table: 'control_measures', prefix: '26',
    direct: (u, id, t) => ({ id, risk_item_id: sid('25', u), description: `Controllo security ${t}` }),
    cross: (_actor, other, id, t) => ({ id, risk_item_id: sid('25', other), description: `Controllo cross ${t}` }),
  },
  {
    module: 'FMEA', table: 'action_plans', prefix: '27',
    direct: (u, id, t) => ({ id, risk_item_id: sid('25', u), description: `Azione security ${t}` }),
    cross: (_actor, other, id, t) => ({ id, risk_item_id: sid('25', other), description: `Azione cross ${t}` }),
  },
  { module: 'FMEA', table: 'user_custom_risks', prefix: '29', direct: (u, id, t) => ({ id, user_id: uid(u), name: `Custom security ${t}`, category: 'Security' }) },
  { module: 'FMEA', table: 'user_settings', prefix: '28', direct: (u, id, t) => ({ id, user_id: uid(u), organization_name: `Security ${t}` }), uniqueOwner: true },

  { module: 'RCA', table: 'rca_assessments', prefix: '30', direct: (u, id, t) => ({ id, user_id: uid(u), title: `RCA security ${t}`, event_title: `Evento security ${t}`, status: 'draft' }) },
  {
    module: 'RCA', table: 'rca_causes', prefix: '31',
    direct: (u, id, t) => ({ id, assessment_id: sid('30', u), user_id: uid(u), description: `Causa security ${t}`, source_type: 'manual' }),
    cross: (actor, other, id, t) => ({ id, assessment_id: sid('30', other), user_id: uid(actor), description: `Causa cross ${t}`, source_type: 'manual' }),
  },
  {
    module: 'RCA', table: 'rca_fishbone_diagrams', prefix: '32',
    direct: (u, id, t, context) => ({ id, assessment_id: context.rcaAssessment[u.label], user_id: uid(u), title: `Diagramma security ${t}`, effect_statement: 'Effetto sintetico' }),
    cross: (actor, other, id, t, context) => ({ id, assessment_id: context.rcaAssessment[other.label], user_id: uid(actor), title: `Diagramma cross ${t}`, effect_statement: 'Effetto sintetico' }),
  },
  {
    module: 'RCA', table: 'rca_fishbone_branches', prefix: '33',
    direct: (u, id, t) => ({ id, diagram_id: sid('32', u), assessment_id: sid('30', u), user_id: uid(u), name: `Ramo security ${t}`, source_type: 'custom' }),
    cross: (actor, other, id, t) => ({ id, diagram_id: sid('32', other), assessment_id: sid('30', other), user_id: uid(actor), name: `Ramo cross ${t}`, source_type: 'custom' }),
  },
  {
    module: 'RCA', table: 'rca_fishbone_causes', prefix: '34',
    direct: (u, id) => ({ id, branch_id: sid('33', u), assessment_id: sid('30', u), user_id: uid(u), cause_id: sid('31', u), sort_order: 8000 }),
    cross: (actor, other, id) => ({ id, branch_id: sid('33', other), assessment_id: sid('30', other), user_id: uid(actor), cause_id: sid('31', other), sort_order: 8100 }),
  },
  {
    module: 'RCA', table: 'rca_five_why_chains', prefix: '35',
    direct: (u, id, t) => ({ id, assessment_id: sid('30', u), user_id: uid(u), title: `Chain security ${t}`, problem_statement: 'Problema sintetico', cause_id: sid('31', u) }),
    cross: (actor, other, id, t) => ({ id, assessment_id: sid('30', other), user_id: uid(actor), title: `Chain cross ${t}`, problem_statement: 'Problema sintetico', cause_id: sid('31', other) }),
  },
  {
    module: 'RCA', table: 'rca_five_why_steps', prefix: '36',
    direct: (u, id, t) => ({ id, chain_id: sid('35', u), assessment_id: sid('30', u), user_id: uid(u), step_number: 8000 + Number(u.suffix), why_question: 'Perche?', answer: `Risposta ${t}`, cause_id: sid('31', u) }),
    cross: (actor, other, id, t) => ({ id, chain_id: sid('35', other), assessment_id: sid('30', other), user_id: uid(actor), step_number: 8100 + Number(actor.suffix), why_question: 'Perche?', answer: `Risposta cross ${t}`, cause_id: sid('31', other) }),
  },
  {
    module: 'RCA', table: 'rca_action_plans', prefix: '37',
    direct: (u, id, t) => ({ id, assessment_id: sid('30', u), cause_id: sid('31', u), user_id: uid(u), description: `Azione RCA security ${t}` }),
    cross: (actor, other, id, t) => ({ id, assessment_id: sid('30', other), cause_id: sid('31', other), user_id: uid(actor), description: `Azione RCA cross ${t}` }),
  },

  { module: 'Gap', table: 'gap_processes', prefix: '40', direct: (u, id, t) => ({ id, user_id: uid(u), code: `SEC-${u.suffix}-${t}`, name: `Processo Gap ${t}` }) },
  {
    module: 'Gap', table: 'gap_areas', prefix: '41',
    direct: (u, id, t) => ({ id, user_id: uid(u), process_id: sid('40', u), code: `SEC-A-${u.suffix}-${t}`, name: `Dominio ${t}` }),
    cross: (actor, other, id, t) => [
      { label: 'processo', payload: { id, user_id: uid(actor), process_id: sid('40', other), code: `SEC-X-${actor.suffix}-${t}`, name: `Dominio cross ${t}` } },
      { label: 'assessment di origine', payload: { id, user_id: uid(actor), process_id: sid('40', actor), code: `SEC-XA-${actor.suffix}-${t}`, name: `Dominio assessment cross ${t}`, source_type: 'assessment_only', created_in_assessment_id: sid('45', other) } },
    ],
  },
  {
    module: 'Gap', table: 'gap_activities', prefix: '42',
    direct: (u, id, t) => ({ id, user_id: uid(u), area_id: sid('41', u), code: `SEC-ACT-${u.suffix}-${t}`, name: `Attivita ${t}`, target_state: 'Target sintetico' }),
    cross: (actor, other, id, t) => [
      { label: 'area', payload: { id, user_id: uid(actor), area_id: sid('41', other), code: `SEC-XACT-${actor.suffix}-${t}`, name: `Attivita cross ${t}`, target_state: 'Target sintetico' } },
      { label: 'assessment di origine', payload: { id, user_id: uid(actor), area_id: sid('41', actor), code: `SEC-XAA-${actor.suffix}-${t}`, name: `Attivita assessment cross ${t}`, target_state: 'Target sintetico', source_type: 'assessment_only', created_in_assessment_id: sid('45', other) } },
    ],
  },
  {
    module: 'Gap', table: 'gap_standards', prefix: '43',
    direct: (u, id, t, context) => ({ id, user_id: uid(u), code: `SEC-STD-${u.suffix}-${t}`, name: `Norma ${t}`, source_type: 'assessment_only', created_in_assessment_id: context.gapAssessment[u.label] }),
    cross: (actor, other, id, t) => ({ id, user_id: uid(actor), code: `SEC-XSTD-${actor.suffix}-${t}`, name: `Norma cross ${t}`, source_type: 'assessment_only', created_in_assessment_id: sid('45', other) }),
  },
  {
    module: 'Gap', table: 'gap_activity_standards', prefix: '44',
    direct: (u, id, _t, context) => ({ id, user_id: uid(u), activity_id: context.linkActivity[u.label], standard_id: context.linkStandard[u.label], specific_reference: 'Security' }),
    cross: (actor, other, id, t, context) => [
      { label: 'attivita', payload: { id, user_id: uid(actor), activity_id: context.linkActivity[other.label], standard_id: context.linkStandard[actor.label], specific_reference: `Cross activity ${t}` } },
      { label: 'norma', payload: { id, user_id: uid(actor), activity_id: context.linkActivity[actor.label], standard_id: context.linkStandard[other.label], specific_reference: `Cross standard ${t}` } },
    ],
  },
  { module: 'Gap', table: 'gap_assessments', prefix: '45', direct: (u, id, t) => ({ id, user_id: uid(u), title: `Gap security ${t}`, status: 'draft' }) },
  {
    module: 'Gap', table: 'gap_assessment_processes', prefix: '46',
    direct: (u, id, _t, context) => ({ id, user_id: uid(u), assessment_id: context.gapAssessment[u.label], process_id: sid('40', u) }),
    cross: (actor, other, id) => [
      { label: 'assessment', payload: { id, user_id: uid(actor), assessment_id: sid('45', other), process_id: sid('40', actor) } },
      { label: 'processo', payload: { id, user_id: uid(actor), assessment_id: sid('45', actor), process_id: sid('40', other) } },
    ],
  },
  {
    module: 'Gap', table: 'gap_activity_evaluations', prefix: '47',
    direct: (u, id, _t, context) => ({ id, user_id: uid(u), assessment_id: context.gapAssessment[u.label], activity_id: sid('42', u), compliance_status: 'not_evaluated' }),
    cross: (actor, other, id) => [
      { label: 'assessment', payload: { id, user_id: uid(actor), assessment_id: sid('45', other), activity_id: sid('42', actor), compliance_status: 'not_evaluated' } },
      { label: 'attivita', payload: { id, user_id: uid(actor), assessment_id: sid('45', actor), activity_id: sid('42', other), compliance_status: 'not_evaluated' } },
    ],
  },
  {
    module: 'Gap', table: 'gap_actions', prefix: '48',
    direct: (u, id, t) => ({ id, user_id: uid(u), assessment_id: sid('45', u), activity_id: sid('42', u), evaluation_id: sid('47', u), description: `Azione Gap ${t}` }),
    cross: (actor, other, id, t) => [
      { label: 'catena completa', payload: { id, user_id: uid(actor), assessment_id: sid('45', other), activity_id: sid('42', other), evaluation_id: sid('47', other), description: `Azione Gap cross ${t}` } },
      { label: 'assessment', payload: { id, user_id: uid(actor), assessment_id: sid('45', other), activity_id: sid('42', actor), evaluation_id: sid('47', actor), description: `Azione assessment cross ${t}` } },
      { label: 'attivita', payload: { id, user_id: uid(actor), assessment_id: sid('45', actor), activity_id: sid('42', other), evaluation_id: sid('47', actor), description: `Azione activity cross ${t}` } },
      { label: 'evaluation', payload: { id, user_id: uid(actor), assessment_id: sid('45', actor), activity_id: sid('42', actor), evaluation_id: sid('47', other), description: `Azione evaluation cross ${t}` } },
      { label: 'dipendenza', payload: { id, user_id: uid(actor), assessment_id: sid('45', actor), activity_id: sid('42', actor), evaluation_id: sid('47', actor), depends_on_action_id: sid('48', other), description: `Azione dependency cross ${t}` } },
    ],
  },
  {
    module: 'Gap', table: 'gap_action_events', prefix: '49',
    direct: (u, id, t) => ({ id, user_id: uid(u), assessment_id: sid('45', u), activity_id: sid('42', u), evaluation_id: sid('47', u), action_id: sid('48', u), event_type: 'note_added', description: `Evento ${t}`, created_by: uid(u) }),
    cross: (actor, other, id, t) => [
      { label: 'catena completa', payload: { id, user_id: uid(actor), assessment_id: sid('45', other), activity_id: sid('42', other), evaluation_id: sid('47', other), action_id: sid('48', other), event_type: 'note_added', description: `Evento cross ${t}`, created_by: uid(actor) } },
      { label: 'created_by', payload: { id, user_id: uid(actor), assessment_id: sid('45', actor), activity_id: sid('42', actor), evaluation_id: sid('47', actor), action_id: sid('48', actor), event_type: 'note_added', description: `Evento actor cross ${t}`, created_by: uid(other) } },
    ],
  },
  {
    module: 'Gap', table: 'gap_links', prefix: '495', seededPrefix: '495',
    direct: (u, id, t) => ({ id, user_id: uid(u), assessment_id: sid('45', u), linked_type: 'external', linked_id: makeUuid(995, Number(u.suffix)), notes: `Link ${t}` }),
    cross: (actor, other, id, t) => [
      { label: 'assessment', payload: { id, user_id: uid(actor), assessment_id: sid('45', other), linked_type: 'external', linked_id: makeUuid(996, Number(actor.suffix)), notes: `Link assessment cross ${t}` } },
      { label: 'attivita', payload: { id, user_id: uid(actor), activity_id: sid('42', other), linked_type: 'external', linked_id: makeUuid(996, Number(actor.suffix)), notes: `Link activity cross ${t}` } },
      { label: 'evaluation', payload: { id, user_id: uid(actor), evaluation_id: sid('47', other), linked_type: 'external', linked_id: makeUuid(996, Number(actor.suffix)), notes: `Link evaluation cross ${t}` } },
    ],
  },
]

async function cleanupId(clients, table, id) {
  for (const client of clients) {
    await client.from(table).delete().eq('id', id)
  }
}

async function setupFixtures(clients, context) {
  for (const [index, user] of USERS.entries()) {
    const tempRcaId = makeUuid(930, index + 1)
    const tempGapId = makeUuid(945, index + 1)
    const linkProcessId = makeUuid(940, index + 1)
    const linkAreaId = makeUuid(941, index + 1)
    const linkActivityId = makeUuid(942, index + 1)
    const linkStandardId = makeUuid(943, index + 1)
    context.rcaAssessment[user.label] = tempRcaId
    context.gapAssessment[user.label] = tempGapId
    context.linkProcess[user.label] = linkProcessId
    context.linkArea[user.label] = linkAreaId
    context.linkActivity[user.label] = linkActivityId
    context.linkStandard[user.label] = linkStandardId

    const { error: rcaError } = await clients[user.label].from('rca_assessments').insert({
      id: tempRcaId,
      user_id: user.id,
      title: `Fixture RLS ${user.label}`,
      event_title: `Fixture event ${user.label}`,
      status: 'draft',
    })
    if (rcaError) throw rcaError

    const { error: gapError } = await clients[user.label].from('gap_assessments').insert({
      id: tempGapId,
      user_id: user.id,
      title: `Fixture Gap ${user.label}`,
      status: 'draft',
    })
    if (gapError) throw gapError

    const { error: processError } = await clients[user.label].from('gap_processes').insert({
      id: linkProcessId,
      user_id: user.id,
      code: `RLS-LINK-P-${user.suffix}`,
      name: `Fixture process ${user.label}`,
    })
    if (processError) throw processError

    const { error: areaError } = await clients[user.label].from('gap_areas').insert({
      id: linkAreaId,
      user_id: user.id,
      process_id: linkProcessId,
      code: `RLS-LINK-A-${user.suffix}`,
      name: `Fixture area ${user.label}`,
    })
    if (areaError) throw areaError

    const { error: activityError } = await clients[user.label].from('gap_activities').insert({
      id: linkActivityId,
      user_id: user.id,
      area_id: linkAreaId,
      code: `RLS-LINK-ACT-${user.suffix}`,
      name: `Fixture activity ${user.label}`,
      target_state: 'Target sintetico',
    })
    if (activityError) throw activityError

    const { error: standardError } = await clients[user.label].from('gap_standards').insert({
      id: linkStandardId,
      user_id: user.id,
      code: `RLS-LINK-STD-${user.suffix}`,
      name: `Fixture standard ${user.label}`,
    })
    if (standardError) throw standardError

    const linkId = sid('495', user)
    await clients[user.label].from('gap_links').delete().eq('id', linkId)
    const { error: linkError } = await clients[user.label].from('gap_links').insert({
      id: linkId,
      user_id: user.id,
      assessment_id: sid('45', user),
      linked_type: 'external',
      linked_id: makeUuid(997, index + 1),
      notes: `Fixture link ${user.label}`,
    })
    if (linkError) throw linkError
  }
}

async function teardownFixtures(clients, context) {
  for (const user of USERS) {
    await clients[user.label].from('gap_links').delete().eq('id', sid('495', user))
    await clients[user.label].from('gap_standards').delete().eq('id', context.linkStandard[user.label])
    await clients[user.label].from('gap_processes').delete().eq('id', context.linkProcess[user.label])
    await clients[user.label].from('gap_assessments').delete().eq('id', context.gapAssessment[user.label])
    await clients[user.label].from('rca_assessments').delete().eq('id', context.rcaAssessment[user.label])
  }
}

async function assertForeignRead(client, table, targetId) {
  const { data, error } = await client.from(table).select('id').eq('id', targetId)
  return !error && (data?.length || 0) === 0
}

async function assertForeignUpdate(client, table, targetId) {
  const { data, error } = await client.from(table).update({ id: targetId }).eq('id', targetId).select('id')
  return Boolean(error) || (data?.length || 0) === 0
}

async function assertForeignDelete(client, table, targetId) {
  const { data, error } = await client.from(table).delete().eq('id', targetId).select('id')
  return Boolean(error) || (data?.length || 0) === 0
}

async function attemptDeniedInsert(client, cleanupClients, table, payload) {
  const { error } = await client.from(table).insert(payload)
  const inserted = !error
  if (inserted) await cleanupId(cleanupClients, table, payload.id)
  return {
    pass: !inserted,
    reason: inserted ? 'Insert consentito' : error?.code || 'Negato',
  }
}

function normalizeCrossCases(config, actor, other, id, uniqueTag, context) {
  if (!config.cross) return []
  const generated = config.cross(actor, other, id, uniqueTag, context)
  const cases = Array.isArray(generated) ? generated : [{ label: 'parent', payload: generated }]
  return cases.map((item, index) => ({
    label: item.label || `parent-${index + 1}`,
    payload: { ...item.payload, id },
  }))
}

function updatePatchFromPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !['id', 'user_id'].includes(key)),
  )
}

function replaceFirstParentWithUnknown(payload, sequence) {
  const parentKey = Object.keys(payload).find(
    (key) => key.endsWith('_id') && !['id', 'user_id'].includes(key),
  )
  if (!parentKey) return null
  return {
    ...payload,
    [parentKey]: makeUuid(899, sequence),
  }
}

async function attemptCrossParentInsert(client, cleanupClients, table, payload) {
  const { error } = await client.from(table).insert(payload)
  const inserted = !error
  if (inserted) await cleanupId(cleanupClients, table, payload.id)
  return {
    pass: Boolean(error && error.code === '42501'),
    reason: inserted ? 'Insert consentito' : error?.code || 'Negato senza codice',
  }
}

async function attemptCrossParentUpdate(client, table, id, patch, restorePatch) {
  const { data, error } = await client.from(table).update(patch).eq('id', id).select('id')
  const updated = !error && (data?.length || 0) > 0

  if (updated) {
    const { error: restoreError } = await client.from(table).update(restorePatch).eq('id', id)
    if (restoreError) throw restoreError
  }

  return {
    pass: Boolean(error && error.code === '42501'),
    reason: updated ? 'Update consentito' : error?.code || 'Nessuna riga aggiornata',
  }
}

async function restoreUserSettings(client, user) {
  const { error } = await client.from('user_settings').insert({
    id: sid('28', user),
    user_id: user.id,
    organization_name: `Organizzazione sintetica ${user.label === 'USER_A' ? 'A' : 'B'}`,
    facility_name: `Struttura locale ${user.label === 'USER_A' ? 'A' : 'B'}`,
  })
  if (error) throw error
}

async function testOwnCrud(config, actor, client, clients, context, uniqueTag, crossCases) {
  const ownId = makeUuid(600 + tables.indexOf(config), Number(actor.suffix))
  const ownPayload = config.direct(actor, ownId, uniqueTag, context)
  const restorePatch = updatePatchFromPayload(ownPayload)
  let fixtureRemoved = false

  if (config.uniqueOwner) {
    const { error } = await client.from(config.table).delete().eq('id', sid(config.prefix, actor))
    if (error) throw error
    fixtureRemoved = true
  }

  try {
    const { error: insertError } = await client.from(config.table).insert(ownPayload)
    const ownInsert = !insertError
    if (!ownInsert) {
      return {
        ownSelect: false,
        ownInsert: false,
        ownUpdate: false,
        ownDelete: false,
        crossParentUpdate: crossCases.length ? false : null,
        crossUpdateDetails: [{ label: 'setup', pass: false, reason: insertError?.code || insertError?.message }],
      }
    }

    const { data: selected, error: selectError } = await client.from(config.table).select('id').eq('id', ownId)
    const ownSelect = !selectError && selected?.length === 1

    const { data: updated, error: updateError } = await client
      .from(config.table)
      .update({ id: ownId })
      .eq('id', ownId)
      .select('id')
    const ownUpdate = !updateError && updated?.length === 1

    const crossUpdateDetails = []
    for (const crossCase of crossCases) {
      const result = await attemptCrossParentUpdate(
        client,
        config.table,
        ownId,
        updatePatchFromPayload(crossCase.payload),
        restorePatch,
      )
      crossUpdateDetails.push({ label: crossCase.label, ...result })
    }

    const { data: deleted, error: deleteError } = await client
      .from(config.table)
      .delete()
      .eq('id', ownId)
      .select('id')
    const ownDelete = !deleteError && deleted?.length === 1

    return {
      ownSelect,
      ownInsert,
      ownUpdate,
      ownDelete,
      crossParentUpdate: crossCases.length
        ? crossUpdateDetails.every((item) => item.pass)
        : null,
      crossUpdateDetails,
    }
  } finally {
    await cleanupId(Object.values(clients), config.table, ownId)
    if (fixtureRemoved) await restoreUserSettings(client, actor)
  }
}

async function testSharedCatalog(clients) {
  const targetId = sid('24', USER_A)
  const rows = []
  for (const actor of USERS) {
    const client = clients[actor.label]
    const { data, error } = await client.from('risk_catalog_base').select('id').eq('id', targetId)
    const select = !error && data?.length === 1
    const insertId = makeUuid(924, Number(actor.suffix))
    const insert = await attemptDeniedInsert(client, Object.values(clients), 'risk_catalog_base', {
      id: insertId,
      category: 'Security',
      name: `Base catalog ${tag()}`,
    })
    const update = await assertForeignUpdate(client, 'risk_catalog_base', targetId)
    const remove = await assertForeignDelete(client, 'risk_catalog_base', targetId)
    rows.push({ actor: actor.label, select, insert: insert.pass, update, delete: remove })
  }
  return {
    module: 'FMEA', table: 'risk_catalog_base',
    ownSelect: rows.every((row) => row.select),
    crossSelect: rows.every((row) => row.select),
    ownInsert: rows.every((row) => row.insert),
    crossInsert: rows.every((row) => row.insert),
    ownUpdate: rows.every((row) => row.update),
    crossUpdate: rows.every((row) => row.update),
    ownDelete: rows.every((row) => row.delete),
    crossDelete: rows.every((row) => row.delete),
    crossParentInsert: null,
    crossParentUpdate: null,
    sharedReadOnly: true,
    details: rows,
  }
}

async function testOwnedTable(config, clients, context) {
  const details = []
  for (const [index, actor] of USERS.entries()) {
    const other = USERS[(index + 1) % USERS.length]
    const actorClient = clients[actor.label]
    const targetId = sid(config.seededPrefix || config.prefix, other)
    const uniqueTag = tag()

    const crossSelect = await assertForeignRead(actorClient, config.table, targetId)
    const crossUpdate = await assertForeignUpdate(actorClient, config.table, targetId)
    const crossDelete = await assertForeignDelete(actorClient, config.table, targetId)

    let crossInsert
    if (config.uniqueOwner) {
      const ownerClient = clients[other.label]
      const originalId = sid(config.prefix, other)
      const { error: removeFixtureError } = await ownerClient
        .from(config.table)
        .delete()
        .eq('id', originalId)
      if (removeFixtureError) throw removeFixtureError

      try {
        const insertId = makeUuid(700 + tables.indexOf(config), index + 1)
        crossInsert = await attemptDeniedInsert(
          actorClient,
          Object.values(clients),
          config.table,
          config.direct(other, insertId, uniqueTag, context),
        )
      } finally {
        await restoreUserSettings(ownerClient, other)
      }
    } else {
      const insertId = makeUuid(700 + tables.indexOf(config), index + 1)
      const foreignPayload = config.direct(other, insertId, uniqueTag, context)
      crossInsert = await attemptDeniedInsert(actorClient, Object.values(clients), config.table, foreignPayload)
    }

    const crossId = makeUuid(800 + tables.indexOf(config), index + 1)
    const crossCases = normalizeCrossCases(config, actor, other, crossId, uniqueTag, context)
    let nonexistentParent = null
    let nonexistentParentReason = 'N/A'
    if (crossCases.length) {
      const invalidId = makeUuid(850 + tables.indexOf(config), index + 1)
      const validOwnPayload = config.direct(actor, invalidId, `${uniqueTag}-missing`, context)
      const invalidPayload = replaceFirstParentWithUnknown(
        validOwnPayload,
        (tables.indexOf(config) + 1) * 10 + index + 1,
      )
      if (invalidPayload) {
        const invalidInsert = await attemptDeniedInsert(
          actorClient,
          Object.values(clients),
          config.table,
          invalidPayload,
        )
        nonexistentParent = invalidInsert.pass
        nonexistentParentReason = invalidInsert.reason
      }
    }
    const ownCrud = await testOwnCrud(
      config,
      actor,
      actorClient,
      clients,
      context,
      uniqueTag,
      crossCases,
    )

    const crossInsertDetails = []
    for (const crossCase of crossCases) {
      const result = await attemptCrossParentInsert(
        actorClient,
        Object.values(clients),
        config.table,
        crossCase.payload,
      )
      crossInsertDetails.push({ label: crossCase.label, ...result })
    }

    details.push({
      actor: actor.label,
      target: other.label,
      ...ownCrud,
      crossSelect,
      crossInsert: crossInsert.pass,
      crossInsertReason: crossInsert.reason,
      crossUpdate,
      crossDelete,
      crossParentInsert: crossCases.length
        ? crossInsertDetails.every((item) => item.pass)
        : null,
      crossInsertDetails,
      nonexistentParent,
      nonexistentParentReason,
    })
  }

  return {
    module: config.module,
    table: config.table,
    ownSelect: details.every((row) => row.ownSelect),
    crossSelect: details.every((row) => row.crossSelect),
    ownInsert: details.every((row) => row.ownInsert),
    crossInsert: details.every((row) => row.crossInsert),
    ownUpdate: details.every((row) => row.ownUpdate),
    crossUpdate: details.every((row) => row.crossUpdate),
    ownDelete: details.every((row) => row.ownDelete),
    crossDelete: details.every((row) => row.crossDelete),
    crossParentInsert: config.cross
      ? details.every((row) => row.crossParentInsert)
      : null,
    crossParentUpdate: config.cross
      ? details.every((row) => row.crossParentUpdate)
      : null,
    nonexistentParent: config.cross
      ? details.every((row) => row.nonexistentParent)
      : null,
    details,
  }
}

const config = await assertLocalEnvironment()
console.log('ENVIRONMENT: LOCAL')

const clients = {}
for (const user of USERS) clients[user.label] = await signInSyntheticUser(config, user)

const context = {
  rcaAssessment: {},
  gapAssessment: {},
  linkProcess: {},
  linkArea: {},
  linkActivity: {},
  linkStandard: {},
}
const matrix = []

try {
  await setupFixtures(clients, context)

  for (const table of tables) {
    const result = table.shared
      ? await testSharedCatalog(clients)
      : await testOwnedTable(table, clients, context)
    const pass = result.ownSelect
      && result.crossSelect
      && result.ownInsert
      && result.crossInsert
      && result.ownUpdate
      && result.crossUpdate
      && result.ownDelete
      && result.crossDelete
      && result.crossParentInsert !== false
      && result.crossParentUpdate !== false
      && result.nonexistentParent !== false
    result.status = pass ? STATUS.PASS : STATUS.FAIL
    matrix.push(result)
    const detail = result.crossParentInsert === false || result.crossParentUpdate === false
      ? 'cross-parent consentito'
      : ''
    printResult(`${result.module}/${result.table}`, result.status, detail)
  }
} finally {
  await teardownFixtures(clients, context)
  for (const client of Object.values(clients)) await client.auth.signOut()
}

const summary = summarizeStatuses(matrix)
const output = {
  generatedAt: new Date().toISOString(),
  environment: 'LOCAL',
  summary,
  matrix,
}
writeResult('rls.json', output)

console.log(`RLS SUMMARY: ${summary.PASS} PASS, ${summary.FAIL} FAIL, ${summary.WARNING} WARNING`)
if (summary.FAIL > 0) process.exitCode = 1
