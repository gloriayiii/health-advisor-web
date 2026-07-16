export const EMPTY_RECOMMENDATION = {
  originalPrompt: '',
  recommendation: '',
  confidence: 0,
  generatedAt: '',
  status: 'pending'
}

export function mapPatientRecord(data = {}) {
  const metadata = data.metadata || data.meta || {}
  return {
    id: data.id,
    name: data.name,
    email: data.email || '',
    age: data.dob ? new Date().getFullYear() - new Date(data.dob).getFullYear() : '',
    gender: data.gender || 'Unknown',
    dateOfBirth: data.dob || '',
    phone: data.phone || '',
    address: data.address || {},
    clinician_id: data.clinician_id || null,
    healthplan_id: data.healthplan_id || null,
    medicalRecord: metadata.medical_record || metadata.medicalRecord || '',
    condition: metadata.condition || '',
    symptoms: metadata.symptoms || '',
    medicalHistory: metadata.medicalHistory || metadata.medical_history || '',
    currentMedications: metadata.currentMedications || metadata.current_medications || '',
    allergies: metadata.allergies || '',
    vitalSigns: metadata.vitalSigns || metadata.vital_signs || {}
  }
}

export function mapRecommendationRecord(record) {
  if (!record) return { ...EMPTY_RECOMMENDATION }
  return {
    originalPrompt: record.original_prompt || '',
    recommendation: record.recommendation || '',
    confidence: record.confidence || 0,
    generatedAt: record.generated_at || record.created_at || '',
    status: record.status || 'pending'
  }
}
