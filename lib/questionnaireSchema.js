const QUESTION_TYPES = new Set([
  'yes_no',
  'single_select',
  'multi_select',
  'text',
  'long_text'
])

export function validateQuestionnaire(questionnaire) {
  if (!questionnaire || typeof questionnaire !== 'object') {
    return { valid: false, error: 'Questionnaire is required' }
  }

  if (!Array.isArray(questionnaire.selectedQuestions) || questionnaire.selectedQuestions.length === 0) {
    return { valid: false, error: 'At least one questionnaire question is required' }
  }

  const ids = new Set()
  for (const question of questionnaire.selectedQuestions) {
    if (!question?.id || !question?.text || !QUESTION_TYPES.has(question.type)) {
      return { valid: false, error: 'Each question requires a valid id, text, and type' }
    }
    if (ids.has(question.id)) {
      return { valid: false, error: `Duplicate question id: ${question.id}` }
    }
    if (
      ['single_select', 'multi_select'].includes(question.type) &&
      (!Array.isArray(question.options) || question.options.length === 0)
    ) {
      return { valid: false, error: `Question ${question.id} requires options` }
    }
    ids.add(question.id)
  }

  return { valid: true }
}

export function validateQuestionnaireResponses(questionnaire, responses) {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    return { valid: false, error: 'Responses must be an object' }
  }

  const questions = questionnaire?.selectedQuestions || []
  for (const question of questions) {
    const value = responses[question.answerKey || question.id]
    const empty = Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim()
    if (question.required && empty) {
      return { valid: false, error: `A response is required for ${question.id}` }
    }
    if (question.type === 'multi_select' && value != null && !Array.isArray(value)) {
      return { valid: false, error: `Response for ${question.id} must be an array` }
    }
  }

  return { valid: true }
}
