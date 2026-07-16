export const QUESTIONNAIRE_SCHEMA_VERSION = '2026-06-04'

function compactText(value, maxLength = 1200) {
  if (value === null || value === undefined) return ''
  const text = Array.isArray(value) ? value.join(', ') : String(value)
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function compactObject(value, maxLength = 1600) {
  if (!value || typeof value !== 'object') return {}
  const serialized = JSON.stringify(value)
  if (serialized.length <= maxLength) return value
  return { summary: `${serialized.slice(0, maxLength)}...` }
}

export function calculateAge(dob) {
  if (!dob) return null
  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDelta = today.getMonth() - birthDate.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return age
}

export function normalizeQuestionnaire(questionnaire = {}) {
  const selectedQuestions = Array.isArray(questionnaire.selectedQuestions)
    ? questionnaire.selectedQuestions.map((question, index) => ({
        id: String(question.id || `question_${index + 1}`),
        order: Number(question.order || index + 1),
        categoryId: question.categoryId || '',
        categoryTitle: question.categoryTitle || '',
        text: question.text || '',
        type: question.type || 'text',
        required: Boolean(question.required),
        options: Array.isArray(question.options) ? question.options : [],
        answerKey: question.answerKey || String(question.id || `question_${index + 1}`)
      }))
    : []

  return {
    id: questionnaire.id || '',
    schemaVersion: questionnaire.schemaVersion || QUESTIONNAIRE_SCHEMA_VERSION,
    status: questionnaire.status || 'draft',
    planInfo: questionnaire.planInfo || '',
    selectedQuestionIds: selectedQuestions.map((question) => question.id),
    selectedQuestions,
    questionConfigs: questionnaire.questionConfigs || {},
    answerTemplate: Object.fromEntries(
      selectedQuestions.map((question) => [
        question.answerKey,
        question.type === 'multi_select' ? [] : ''
      ])
    ),
    delivery: {
      sentAt: questionnaire.sentAt || questionnaire.delivery?.sentAt || null,
      destination: questionnaire.destination || questionnaire.delivery?.destination || '',
      externalServerStatus:
        questionnaire.externalServerStatus ||
        questionnaire.delivery?.externalServerStatus ||
        'not_configured',
      externalServerResponse:
        questionnaire.externalServerResponse ||
        questionnaire.delivery?.externalServerResponse ||
        null
    },
    sentAt: questionnaire.sentAt || questionnaire.delivery?.sentAt || null,
    totalQuestionsSelected: selectedQuestions.length
  }
}

export function normalizePatientContext(patient = {}) {
  const metadata = patient.metadata || patient.meta || {}

  return {
    patient: {
      id: patient.id || '',
      dob: patient.dob || patient.dateOfBirth || '',
      age: patient.age || calculateAge(patient.dob || patient.dateOfBirth),
      gender: compactText(patient.gender, 80)
    },
    medicalDetails: {
      primaryCondition: compactText(metadata.condition || patient.condition),
      symptoms: compactText(metadata.symptoms || patient.symptoms),
      medicalHistory: compactText(
        metadata.medicalHistory || metadata.medical_history || patient.medicalHistory
      ),
      currentMedications: compactText(
        metadata.currentMedications ||
        metadata.current_medications ||
        patient.currentMedications ||
        ''
      ),
      allergies: compactText(metadata.allergies || patient.allergies),
      vitalSigns: compactObject(
        metadata.vitalSigns || metadata.vital_signs || patient.vitalSigns || {}
      ),
      patientGoals: compactText(metadata.patientGoals || metadata.patient_goals),
      clinicianNotes: compactText(metadata.clinicianNotes || metadata.clinician_notes)
    }
  }
}

export function buildRecommendationPrompts(patient) {
  const context = normalizePatientContext(patient)
  const systemPrompt = [
    'You are a clinical decision support assistant for licensed healthcare clinicians.',
    'Return concise, clinician-facing recommendations only.',
    'Include assessment, management plan, monitoring plan, safety considerations, and follow-up needs.',
    'Do not invent missing values. Mark important missing information as unknown or needs confirmation.',
    'Do not diagnose or prescribe without clinician review.',
    '',
    `Patient context: ${JSON.stringify(context)}`
  ].join('\n')

  const userPrompt = [
    'Generate an evidence-informed recommendation for this patient.',
    'Output plain clinical text that can be reviewed, edited, approved, and stored server-side.',
    'Patient context is supplied in the system prompt.'
  ].join('\n')

  return { context, systemPrompt, userPrompt }
}
