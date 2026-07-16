# Health Advisor Architecture

## Shared Data

The portal and patient app use one Supabase project. Supabase Auth owns
credentials. `public.users.portal_patient_id` links an app Auth user to the
canonical `public.patients.id`.

## Questionnaire Flow

1. The portal normalizes and validates a questionnaire.
2. The portal upserts it into `public.questionnaires`.
3. The app fetches only the newest questionnaire with `status = 'sent'`.
4. The app validates answers and upserts into `public.questionnaire_responses`
   using `(questionnaire_id, user_id)` as the duplicate-submission key.
5. The clinician portal reads responses newest-first.

Optional webhook delivery is notification-only. A webhook outage marks delivery
as failed but does not remove the Supabase questionnaire.

## Recommendation Flow

`POST /api/recommendations` is the only recommendation creation endpoint.
`generate: true` streams Ollama output through SSE and stores the completed
record. Reopening a patient loads the latest stored recommendation.

## Reliability

- JSON APIs use `{ success, data, error }`.
- API requests receive an `x-request-id`.
- Structured logs contain route, method, status, duration, model, and event
  state only. Medical fields, answers, prompts, and generated text are excluded.
- Supabase RLS protects patient and questionnaire records.
- Contract and integration checks run with `npm test`.
