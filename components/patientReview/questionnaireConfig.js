export const QUESTION_TYPE_OPTIONS = [
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'single_select', label: 'Single selection' },
  { value: 'multi_select', label: 'Multiple select (Select all that apply)' },
  { value: 'text', label: 'Text input' },
  { value: 'long_text', label: 'Long text input' }
]

export const QUESTION_CATEGORIES = [
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    questions: [
      { id: 'smoke', text: 'Do you smoke?', type: 'yes_no' },
      { id: 'alcohol', text: 'Do you consume alcohol?', type: 'yes_no' },
      { id: 'sleep_hours', text: 'How many hours of sleep do you get per night?', type: 'text' },
      { id: 'exercise_frequency', text: 'How often do you exercise in a typical week?', type: 'single_select', options: ['Never', '1-2 days', '3-4 days', '5+ days'] },
      { id: 'dietary_restrictions', text: 'Do you have any dietary restrictions?', type: 'multi_select', options: ['Low sodium', 'Low sugar', 'Gluten free', 'Vegetarian', 'None'] },
      { id: 'stress_level', text: 'How would you describe your current stress level?', type: 'single_select', options: ['Low', 'Moderate', 'High'] }
    ]
  },
  {
    id: 'medical_history',
    title: 'Medical History',
    questions: [
      { id: 'active_medications', text: 'Are you currently on any medication?', type: 'yes_no' },
      { id: 'hypertension_history', text: 'Do you have a history of hypertension?', type: 'yes_no' },
      { id: 'diabetes', text: 'Do you have diabetes?', type: 'yes_no' },
      { id: 'recent_surgery', text: 'Have you had any surgeries in the past year?', type: 'yes_no' },
      { id: 'pregnancy', text: 'Are you pregnant or planning pregnancy?', type: 'yes_no' },
      { id: 'allergies', text: 'Please list any allergies you have.', type: 'long_text' }
    ]
  },
  {
    id: 'symptoms_monitoring',
    title: 'Symptoms and Monitoring',
    questions: [
      { id: 'chest_pain', text: 'Have you experienced any chest pain?', type: 'yes_no' },
      { id: 'shortness_breath', text: 'Do you experience shortness of breath?', type: 'yes_no' },
      { id: 'headaches', text: 'Do you experience frequent headaches?', type: 'yes_no' },
      { id: 'home_bp', text: 'Do you monitor your blood pressure at home?', type: 'yes_no' },
      { id: 'weight_change', text: 'Have you noticed any changes in weight recently?', type: 'single_select', options: ['Weight loss', 'Weight gain', 'No major change'] },
      { id: 'symptom_notes', text: 'Describe any recent symptoms we should know about.', type: 'long_text' }
    ]
  },
  {
    id: 'function_sensory',
    title: 'Functional and Sensory',
    questions: [
      { id: 'mobility', text: 'Do you have trouble with mobility?', type: 'yes_no' },
      { id: 'assistive_devices', text: 'Do you use any assistive devices?', type: 'multi_select', options: ['Cane', 'Walker', 'Wheelchair', 'Hearing aid', 'None'] },
      { id: 'vision_changes', text: 'Do you have vision changes?', type: 'yes_no' },
      { id: 'hearing_problems', text: 'Do you have any hearing problems?', type: 'yes_no' },
      { id: 'joint_pain', text: 'Do you experience joint pain?', type: 'yes_no' },
      { id: 'concentration', text: 'Do you have trouble concentrating?', type: 'yes_no' }
    ]
  },
  {
    id: 'preventive_other',
    title: 'Preventive and Other',
    questions: [
      { id: 'flu_vaccine', text: 'Have you been vaccinated for influenza this year?', type: 'yes_no' },
      { id: 'depression_history', text: 'Do you have a history of depression?', type: 'yes_no' },
      { id: 'sleep_quality', text: 'Do you have trouble sleeping?', type: 'yes_no' },
      { id: 'dizziness', text: 'Do you experience dizziness or fainting?', type: 'yes_no' },
      { id: 'family_heart', text: 'Do you have a family history of heart disease?', type: 'yes_no' },
      { id: 'patient_goals', text: 'What are your top health goals for the next 3 months?', type: 'long_text' }
    ]
  }
]

export const ALL_QUESTION_DEFS = QUESTION_CATEGORIES.flatMap((category) =>
  category.questions.map((question) => ({
    ...question,
    categoryId: category.id,
    categoryTitle: category.title
  }))
)

export const QUESTION_BY_ID = Object.fromEntries(
  ALL_QUESTION_DEFS.map((question) => [question.id, question])
)
export const QUESTION_ID_BY_TEXT = Object.fromEntries(
  ALL_QUESTION_DEFS.map((question) => [question.text, question.id])
)
export const QUESTIONNAIRE_SCHEMA_VERSION = '2026-06-04'

export function isChoiceType(type) {
  return ['yes_no', 'single_select', 'multi_select'].includes(type)
}

export function getDefaultChoiceOptions(questionId, type, baseOptions = []) {
  if (baseOptions.length) return baseOptions
  if (type === 'yes_no') return ['Yes', 'No']

  const options = {
    sleep_hours: ['4-5 hours', '6-7 hours', '8+ hours'],
    exercise_frequency: ['Never', '1-2 days', '3-4 days', '5+ days'],
    dietary_restrictions: ['Low sodium', 'Low sugar', 'Gluten free', 'Vegetarian', 'None'],
    stress_level: ['Low', 'Moderate', 'High'],
    weight_change: ['Weight loss', 'Weight gain', 'No major change'],
    assistive_devices: ['Cane', 'Walker', 'Wheelchair', 'Hearing aid', 'None']
  }

  return options[questionId] || (type === 'single_select'
    ? ['Option 1', 'Option 2', 'Option 3']
    : ['Option A', 'Option B', 'Option C'])
}
