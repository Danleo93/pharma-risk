import {
  assertLocalEnvironment,
  makeUuid,
  printResult,
  signInSyntheticUser,
  STATUS,
  USERS,
  writeResult,
} from './lib.mjs'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function insertOne(client, table, payload) {
  const { data, error } = await client.from(table).insert(payload).select('*').single()
  if (error) throw new Error(`${table} INSERT: ${error.code || ''} ${error.message}`)
  return data
}

async function updateOne(client, table, id, patch) {
  const { data, error } = await client.from(table).update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(`${table} UPDATE: ${error.code || ''} ${error.message}`)
  return data
}

async function deleteOne(client, table, id) {
  const { error } = await client.from(table).delete().eq('id', id)
  if (error) throw new Error(`${table} DELETE: ${error.code || ''} ${error.message}`)
}

async function runFmea(client, user, index) {
  const ids = {
    area: makeUuid(951, index),
    process: makeUuid(952, index),
    step: makeUuid(953, index),
    assessment: makeUuid(954, index),
    catalog: makeUuid(955, index),
    risk: makeUuid(956, index),
    control: makeUuid(957, index),
    action: makeUuid(958, index),
  }

  try {
    await insertOne(client, 'areas', {
      id: ids.area,
      user_id: user.id,
      name: `Smoke area ${user.label}`,
    })
    await insertOne(client, 'processes', {
      id: ids.process,
      user_id: user.id,
      area_id: ids.area,
      name: `Smoke process ${user.label}`,
    })
    await insertOne(client, 'process_steps', {
      id: ids.step,
      process_id: ids.process,
      step_number: 1,
      name: `Smoke step ${user.label}`,
    })
    await insertOne(client, 'risk_catalog_user', {
      id: ids.catalog,
      user_id: user.id,
      category: 'Smoke',
      name: `Smoke catalog ${user.label}`,
    })
    await insertOne(client, 'risk_assessments', {
      id: ids.assessment,
      user_id: user.id,
      area_id: ids.area,
      process_id: ids.process,
      title: `Smoke FMEA ${user.label}`,
      status: 'draft',
    })
    await insertOne(client, 'risk_items', {
      id: ids.risk,
      assessment_id: ids.assessment,
      process_step_id: ids.step,
      risk_catalog_user_id: ids.catalog,
      custom_risk_name: `Smoke risk ${user.label}`,
      severity: 2,
      probability: 2,
      detectability: 2,
    })
    await insertOne(client, 'control_measures', {
      id: ids.control,
      risk_item_id: ids.risk,
      description: `Smoke control ${user.label}`,
    })
    await insertOne(client, 'action_plans', {
      id: ids.action,
      risk_item_id: ids.risk,
      description: `Smoke action ${user.label}`,
      status: 'planned',
    })

    const updatedAssessment = await updateOne(client, 'risk_assessments', ids.assessment, {
      status: 'in_progress',
    })
    const updatedAction = await updateOne(client, 'action_plans', ids.action, {
      status: 'in_progress',
    })
    assert(updatedAssessment.status === 'in_progress', 'FMEA assessment update non persistito.')
    assert(updatedAction.status === 'in_progress', 'FMEA action update non persistito.')
  } finally {
    await deleteOne(client, 'risk_assessments', ids.assessment)
    await deleteOne(client, 'risk_catalog_user', ids.catalog)
    await deleteOne(client, 'areas', ids.area)
  }
}

async function runRca(client, user, index) {
  const ids = {
    assessment: makeUuid(960, index),
    cause: makeUuid(961, index),
    diagram: makeUuid(962, index),
    branch: makeUuid(963, index),
    fishboneCause: makeUuid(964, index),
    chain: makeUuid(965, index),
    step: makeUuid(966, index),
    action: makeUuid(967, index),
  }

  try {
    await insertOne(client, 'rca_assessments', {
      id: ids.assessment,
      user_id: user.id,
      title: `Smoke RCA ${user.label}`,
      event_title: `Smoke event ${user.label}`,
      status: 'draft',
    })
    await insertOne(client, 'rca_causes', {
      id: ids.cause,
      assessment_id: ids.assessment,
      user_id: user.id,
      description: `Smoke cause ${user.label}`,
      source_type: 'manual',
    })
    await insertOne(client, 'rca_fishbone_diagrams', {
      id: ids.diagram,
      assessment_id: ids.assessment,
      user_id: user.id,
      title: `Smoke Ishikawa ${user.label}`,
      effect_statement: 'Synthetic effect',
    })
    await insertOne(client, 'rca_fishbone_branches', {
      id: ids.branch,
      diagram_id: ids.diagram,
      assessment_id: ids.assessment,
      user_id: user.id,
      name: `Smoke branch ${user.label}`,
      source_type: 'custom',
    })
    await insertOne(client, 'rca_fishbone_causes', {
      id: ids.fishboneCause,
      branch_id: ids.branch,
      assessment_id: ids.assessment,
      user_id: user.id,
      cause_id: ids.cause,
    })
    await insertOne(client, 'rca_five_why_chains', {
      id: ids.chain,
      assessment_id: ids.assessment,
      user_id: user.id,
      title: `Smoke chain ${user.label}`,
      problem_statement: 'Synthetic problem',
      cause_id: ids.cause,
    })
    await insertOne(client, 'rca_five_why_steps', {
      id: ids.step,
      chain_id: ids.chain,
      assessment_id: ids.assessment,
      user_id: user.id,
      step_number: 1,
      why_question: 'Why?',
      answer: 'Synthetic answer',
      cause_id: ids.cause,
    })
    await insertOne(client, 'rca_action_plans', {
      id: ids.action,
      assessment_id: ids.assessment,
      cause_id: ids.cause,
      user_id: user.id,
      description: `Smoke RCA action ${user.label}`,
      status: 'planned',
    })

    const updatedCause = await updateOne(client, 'rca_causes', ids.cause, {
      root_cause_status: 'candidate',
    })
    const updatedAction = await updateOne(client, 'rca_action_plans', ids.action, {
      status: 'in_progress',
    })
    assert(updatedCause.root_cause_status === 'candidate', 'RCA cause update non persistito.')
    assert(updatedAction.status === 'in_progress', 'RCA action update non persistito.')
  } finally {
    await deleteOne(client, 'rca_assessments', ids.assessment)
  }
}

async function runGap(client, user, index) {
  const ids = {
    process: makeUuid(970, index),
    area: makeUuid(971, index),
    activity: makeUuid(972, index),
    standard: makeUuid(973, index),
    activityStandard: makeUuid(974, index),
    assessment: makeUuid(975, index),
    assessmentProcess: makeUuid(976, index),
    evaluation: makeUuid(977, index),
    action: makeUuid(978, index),
    event: makeUuid(979, index),
  }

  try {
    await insertOne(client, 'gap_processes', {
      id: ids.process,
      user_id: user.id,
      code: `SMOKE-P-${user.suffix}`,
      name: `Smoke Gap process ${user.label}`,
    })
    await insertOne(client, 'gap_areas', {
      id: ids.area,
      user_id: user.id,
      process_id: ids.process,
      code: `SMOKE-A-${user.suffix}`,
      name: `Smoke Gap area ${user.label}`,
    })
    await insertOne(client, 'gap_activities', {
      id: ids.activity,
      user_id: user.id,
      area_id: ids.area,
      code: `SMOKE-ACT-${user.suffix}`,
      name: `Smoke Gap activity ${user.label}`,
      target_state: 'Synthetic target',
    })
    await insertOne(client, 'gap_standards', {
      id: ids.standard,
      user_id: user.id,
      code: `SMOKE-STD-${user.suffix}`,
      name: `Smoke Gap standard ${user.label}`,
    })
    await insertOne(client, 'gap_activity_standards', {
      id: ids.activityStandard,
      user_id: user.id,
      activity_id: ids.activity,
      standard_id: ids.standard,
      specific_reference: 'Synthetic reference',
    })
    await insertOne(client, 'gap_assessments', {
      id: ids.assessment,
      user_id: user.id,
      title: `Smoke Gap ${user.label}`,
      status: 'draft',
    })
    await insertOne(client, 'gap_assessment_processes', {
      id: ids.assessmentProcess,
      user_id: user.id,
      assessment_id: ids.assessment,
      process_id: ids.process,
    })
    await insertOne(client, 'gap_activity_evaluations', {
      id: ids.evaluation,
      user_id: user.id,
      assessment_id: ids.assessment,
      activity_id: ids.activity,
      compliance_status: 'non_compliant',
      risk_priority: 'high',
    })
    await insertOne(client, 'gap_actions', {
      id: ids.action,
      user_id: user.id,
      assessment_id: ids.assessment,
      activity_id: ids.activity,
      evaluation_id: ids.evaluation,
      description: `Smoke Gap action ${user.label}`,
      status: 'planned',
    })
    await insertOne(client, 'gap_action_events', {
      id: ids.event,
      user_id: user.id,
      assessment_id: ids.assessment,
      activity_id: ids.activity,
      evaluation_id: ids.evaluation,
      action_id: ids.action,
      event_type: 'created',
      description: 'Synthetic event',
      created_by: user.id,
    })

    const updatedEvaluation = await updateOne(client, 'gap_activity_evaluations', ids.evaluation, {
      compliance_status: 'partially_compliant',
    })
    const verifiedAction = await updateOne(client, 'gap_actions', ids.action, {
      status: 'verified',
      verification_result: 'effective',
      verified_at: new Date().toISOString(),
    })
    assert(updatedEvaluation.compliance_status === 'partially_compliant', 'Gap evaluation update non persistito.')
    assert(verifiedAction.status === 'verified', 'Gap verification update non persistito.')
  } finally {
    await deleteOne(client, 'gap_assessments', ids.assessment)
    await deleteOne(client, 'gap_processes', ids.process)
    await deleteOne(client, 'gap_standards', ids.standard)
  }
}

const config = await assertLocalEnvironment()
console.log('ENVIRONMENT: LOCAL')

const results = []
for (const [index, user] of USERS.entries()) {
  const client = await signInSyntheticUser(config, user)
  try {
    for (const [module, run] of [['FMEA', runFmea], ['RCA', runRca], ['Gap', runGap]]) {
      try {
        await run(client, user, index + 1)
        results.push({ user: user.label, module, status: STATUS.PASS })
        printResult(`${user.label}/${module}`, STATUS.PASS)
      } catch (error) {
        results.push({
          user: user.label,
          module,
          status: STATUS.FAIL,
          error: error instanceof Error ? error.message : String(error),
        })
        printResult(`${user.label}/${module}`, STATUS.FAIL, error instanceof Error ? error.message : String(error))
      }
    }
  } finally {
    await client.auth.signOut()
  }
}

const failed = results.filter((result) => result.status === STATUS.FAIL)
writeResult('functional-smoke.json', {
  generatedAt: new Date().toISOString(),
  environment: 'LOCAL',
  status: failed.length ? STATUS.FAIL : STATUS.PASS,
  results,
})

console.log(`FUNCTIONAL SMOKE: ${results.length - failed.length} PASS, ${failed.length} FAIL`)
if (failed.length) process.exitCode = 1
