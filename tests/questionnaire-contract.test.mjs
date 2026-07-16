import test from 'node:test'
import assert from 'node:assert/strict'
import { importStandalone } from './helpers.mjs'

const medicalContext = await importStandalone('lib/medicalContext.js')
const schema = await importStandalone('lib/questionnaireSchema.js')

test('normalizes partial questionnaire fields into the canonical contract', () => {
  const normalized = medicalContext.normalizeQuestionnaire({
    selectedQuestions: [{ text: 'Any symptoms?', type: 'text', required: true }]
  })

  assert.equal(normalized.schemaVersion, medicalContext.QUESTIONNAIRE_SCHEMA_VERSION)
  assert.equal(normalized.selectedQuestions[0].id, 'question_1')
  assert.equal(normalized.selectedQuestions[0].answerKey, 'question_1')
  assert.deepEqual(normalized.answerTemplate, { question_1: '' })
})

test('rejects duplicate questions and invalid response types', () => {
  const duplicate = {
    selectedQuestions: [
      { id: 'same', text: 'First', type: 'text' },
      { id: 'same', text: 'Second', type: 'text' }
    ]
  }
  assert.equal(schema.validateQuestionnaire(duplicate).valid, false)

  const questionnaire = {
    selectedQuestions: [{ id: 'multi', text: 'Select', type: 'multi_select' }]
  }
  assert.equal(
    schema.validateQuestionnaireResponses(questionnaire, { multi: 'not-an-array' }).valid,
    false
  )
})
