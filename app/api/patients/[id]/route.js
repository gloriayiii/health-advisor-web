import { requireClinician } from '../../../../lib/auth'
import { apiError, apiSuccess } from '../../../../lib/apiResponse'
import { normalizeQuestionnaire } from '../../../../lib/medicalContext'
import { pushQuestionnaireToExternalServer } from '../../../../lib/questionnaireDelivery'
import { validateQuestionnaire } from '../../../../lib/questionnaireSchema'
import { getRequestId, structuredLog } from '../../../../lib/logger'

async function normalizePatientPatch(client, clinician, existing, patch) {
  if (!patch.metadata) return patch

  const metadata = {
    ...(existing?.metadata || {}),
    ...patch.metadata
  }

  if (metadata.questionnaire) {
    const normalizedQuestionnaire = normalizeQuestionnaire({
      ...metadata.questionnaire,
      id: metadata.questionnaire.id || crypto.randomUUID()
    })
    const validation = validateQuestionnaire(normalizedQuestionnaire)
    if (normalizedQuestionnaire.status === 'sent' && !validation.valid) {
      const error = new Error(validation.error)
      error.code = 'INVALID_QUESTIONNAIRE'
      throw error
    }

    const baseRecord = {
      id: normalizedQuestionnaire.id,
      patient_id: existing.id,
      clinician_id: patch.clinician_id || existing.clinician_id || clinician.id,
      schema_version: normalizedQuestionnaire.schemaVersion,
      status: normalizedQuestionnaire.status,
      payload: normalizedQuestionnaire,
      sent_at: normalizedQuestionnaire.sentAt,
      delivery_status: normalizedQuestionnaire.status === 'sent' ? 'available' : 'not_attempted',
      delivery_error: null
    }
    const { error: questionnaireError } = await client
      .from('questionnaires')
      .upsert(baseRecord)
    if (questionnaireError) throw questionnaireError

    const delivery = await pushQuestionnaireToExternalServer(
      { ...existing, ...patch, metadata },
      normalizedQuestionnaire
    )
    const deliveryStatus = delivery.pushResult.attempted
      ? delivery.pushResult.status
      : normalizedQuestionnaire.status === 'sent'
        ? 'available'
        : 'not_attempted'
    const deliveredQuestionnaire = {
      ...delivery.questionnaire,
      delivery: {
        ...delivery.questionnaire.delivery,
        externalServerStatus: deliveryStatus
      }
    }
    metadata.questionnaire = deliveredQuestionnaire
    metadata.questionnairePushResult = delivery.pushResult

    const { error: deliveryError } = await client
      .from('questionnaires')
      .update({
        payload: deliveredQuestionnaire,
        delivery_status: deliveryStatus,
        delivery_error: deliveryStatus === 'failed' ? delivery.pushResult.response : null
      })
      .eq('id', normalizedQuestionnaire.id)
    if (deliveryError) throw deliveryError
  }

  return { ...patch, metadata }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireClinician(request)
    if (auth.error) return auth.error
    const { client } = auth
    const { data, error } = await client.from('patients').select('*').eq('id', params.id).single()
    if (error) return apiError(error, 404)
    return apiSuccess({ patient: data })
  } catch (error) {
    return apiError(error, 500)
  }
}

export async function PUT(request, { params }) {
  const requestId = getRequestId(request)
  try {
    const auth = await requireClinician(request)
    if (auth.error) return auth.error
    const { client, clinician } = auth
    const patch = await request.json()
    const { data: existing, error: existingError } = await client
      .from('patients')
      .select('*')
      .eq('id', params.id)
      .single()

    if (existingError) {
      return apiError(existingError, 404)
    }

    const normalizedPatch = await normalizePatientPatch(client, clinician, existing, patch)
    const { data, error } = await client
      .from('patients')
      .update(normalizedPatch)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return apiError(error, 500)
    structuredLog('info', 'patient.updated', {
      requestId,
      questionnaireIncluded: Boolean(patch.metadata?.questionnaire)
    })
    return apiSuccess({ patient: data })
  } catch (error) {
    structuredLog('error', 'patient.update.failed', {
      requestId,
      error: error.message
    })
    return apiError(error, error.code === 'INVALID_QUESTIONNAIRE' ? 400 : 500)
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  const { error } = await auth.client.from('patients').delete().eq('id', params.id)
  if (error) return apiError(error, 500)
  return apiSuccess()
}
