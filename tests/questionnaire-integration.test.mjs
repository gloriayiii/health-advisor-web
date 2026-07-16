import test from 'node:test'
import assert from 'node:assert/strict'
import { importStandalone } from './helpers.mjs'

const delivery = await importStandalone('lib/questionnaireDelivery.js')
const review = await importStandalone('lib/questionnaireResponses.js')

test('send reports server outage as failed without throwing', async () => {
  const previousUrl = process.env.QUESTIONNAIRE_PUSH_URL
  process.env.QUESTIONNAIRE_PUSH_URL = 'http://questionnaire.test'
  const previousFetch = global.fetch
  global.fetch = async () => {
    throw new Error('server offline')
  }

  try {
    const result = await delivery.pushQuestionnaireToExternalServer(
      { id: 'patient-id', metadata: {} },
      { status: 'sent', schemaVersion: '1', delivery: {} }
    )
    assert.equal(result.pushResult.status, 'failed')
    assert.match(result.pushResult.response, /offline/)
  } finally {
    global.fetch = previousFetch
    if (previousUrl === undefined) delete process.env.QUESTIONNAIRE_PUSH_URL
    else process.env.QUESTIONNAIRE_PUSH_URL = previousUrl
  }
})

test('clinician review returns newest responses first', async () => {
  const rows = [
    { id: 'new', submitted_at: '2026-02-02T00:00:00Z' },
    { id: 'old', submitted_at: '2026-01-01T00:00:00Z' }
  ]
  const query = {
    select() { return this },
    eq(column, value) {
      assert.equal(column, 'questionnaire_id')
      assert.equal(value, 'questionnaire-id')
      return this
    },
    async order(column, options) {
      assert.equal(column, 'submitted_at')
      assert.deepEqual(options, { ascending: false })
      return { data: rows, error: null }
    }
  }
  const client = {
    from(table) {
      assert.equal(table, 'questionnaire_responses')
      return query
    }
  }

  assert.deepEqual(
    await review.listQuestionnaireResponses(client, 'questionnaire-id'),
    rows
  )
})
