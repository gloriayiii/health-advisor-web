export function getQuestionnairePushUrl() {
  return process.env.QUESTIONNAIRE_PUSH_URL || process.env.HEALTH_QUESTIONNAIRE_PUSH_URL || ''
}

function buildPatientPayload(patient) {
  const metadata = patient.metadata || patient.meta || {}

  return {
    id: patient.id || '',
    email: patient.email || '',
    clinicianId: patient.clinician_id || patient.clinicianId || null,
    healthPlanId: patient.healthplan_id || patient.healthPlanId || null,
    medicalRecord: metadata.medical_record || metadata.medicalRecord || '',
    primaryCondition: metadata.condition || patient.condition || '',
    symptoms: metadata.symptoms || patient.symptoms || '',
    medicalHistory: metadata.medicalHistory || metadata.medical_history || '',
    currentMedications: metadata.currentMedications || metadata.current_medications || '',
    allergies: metadata.allergies || '',
    vitalSigns: metadata.vitalSigns || metadata.vital_signs || {}
  }
}

export async function pushQuestionnaireToExternalServer(patient, questionnaire) {
  const url = getQuestionnairePushUrl()
  const patientPayload = buildPatientPayload(patient)
  const payload = {
    event: 'health_questionnaire.sent',
    schemaVersion: questionnaire.schemaVersion,
    patientId: patientPayload.id,
    patientEmail: patientPayload.email || null,
    clinicianId: patientPayload.clinicianId,
    healthPlanId: patientPayload.healthPlanId,
    patient: patientPayload,
    questionnaire
  }

  if (!url || questionnaire.status !== 'sent') {
    return {
      questionnaire,
      pushResult: {
        attempted: false,
        status: url ? 'not_sent' : 'not_configured',
        response: null
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    return {
      questionnaire: {
        ...questionnaire,
        delivery: {
          ...questionnaire.delivery,
          destination: url,
          externalServerStatus: response.ok ? 'pushed' : 'failed',
          externalServerResponse: responseText || null
        }
      },
      pushResult: {
        attempted: true,
        status: response.ok ? 'pushed' : 'failed',
        response: responseText || null
      }
    }
  } catch (error) {
    return {
      questionnaire: {
        ...questionnaire,
        delivery: {
          ...questionnaire.delivery,
          destination: url,
          externalServerStatus: 'failed',
          externalServerResponse: error.message
        }
      },
      pushResult: {
        attempted: true,
        status: 'failed',
        response: error.message
      }
    }
  }
}
