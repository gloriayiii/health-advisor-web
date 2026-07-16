import { requireClinician } from '../../../lib/auth'
import { apiError, apiSuccess } from '../../../lib/apiResponse'
import {
  OLLAMA_FINAL_MODEL,
  isOllamaAvailable,
  streamOllamaGenerate
} from '../../../lib/ollama'
import { buildRecommendationPrompts } from '../../../lib/medicalContext'
import { getRequestId, structuredLog } from '../../../lib/logger'

const encoder = new TextEncoder()

function sseEvent(event, data) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function GET(request) {
  try {
    const auth = await requireClinician(request)
    if (auth.error) return auth.error

    const patientId = new URL(request.url).searchParams.get('patient_id')
    let query = auth.client.from('recommendations').select('*')
    if (patientId) query = query.eq('patient_id', patientId).limit(1)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return apiError(error, 500)
    return apiSuccess(data || [])
  } catch (error) {
    return apiError(error, 500)
  }
}

export async function POST(request) {
  const requestId = getRequestId(request)
  try {
    const auth = await requireClinician(request)
    if (auth.error) return auth.error

    const body = await request.json()
    if (!body?.generate) {
      if (!body?.patient_id || !body?.recommendation) {
        return apiError('patient_id and recommendation required', 400)
      }

      const { data, error } = await auth.client
        .from('recommendations')
        .insert([{ ...body, clinician_id: auth.clinician.id }])
        .select()
        .single()
      if (error) return apiError(error, 500)
      structuredLog('info', 'recommendation.saved', {
        requestId,
        status: data.status
      })
      return apiSuccess(data, 201)
    }

    if (!body.patient_id) {
      return apiError('patient_id is required', 400)
    }

    const [{ data: patient, error: patientError }, available] = await Promise.all([
      auth.client.from('patients').select('*').eq('id', body.patient_id).single(),
      isOllamaAvailable()
    ])

    if (patientError || !patient) {
      return apiError(patientError?.message || 'Patient not found', 404)
    }
    if (!available) {
      return apiError(
        'Ollama is unavailable. Start Ollama and verify the configured model.',
        503
      )
    }

    const { context, systemPrompt, userPrompt } = buildRecommendationPrompts(patient)
    const model = OLLAMA_FINAL_MODEL
    const maxTokens = Math.min(
      2000,
      Math.max(300, Number(process.env.OLLAMA_FINAL_MAX_TOKENS || 800))
    )

    const stream = new ReadableStream({
      async start(controller) {
        try {
          structuredLog('info', 'recommendation.generation.started', {
            requestId,
            model
          })
          controller.enqueue(sseEvent('meta', { model, provider: 'ollama' }))
          const content = await streamOllamaGenerate({
            prompt: userPrompt,
            systemPrompt,
            model,
            temperature: 0.2,
            maxTokens,
            signal: request.signal,
            onToken: (token) => controller.enqueue(sseEvent('token', { content: token }))
          })

          const record = {
            patient_id: patient.id,
            clinician_id: auth.clinician.id,
            original_prompt: userPrompt,
            recommendation: content.trim(),
            confidence: 0.75,
            status: 'pending',
            generated_at: new Date().toISOString(),
            metadata: {
              model_used: model,
              provider: 'ollama',
              patient_context: context,
              output_contract: {
                format: 'plain_clinical_text',
                stored_server_side: true
              }
            }
          }

          const { data, error } = await auth.client
            .from('recommendations')
            .insert([record])
            .select()
            .single()
          if (error) throw error

          structuredLog('info', 'recommendation.generation.completed', {
            requestId,
            model,
            status: data.status
          })
          controller.enqueue(sseEvent('done', { recommendation: data }))
        } catch (error) {
          structuredLog('error', 'recommendation.generation.failed', {
            requestId,
            model,
            error: error.message
          })
          controller.enqueue(sseEvent('error', { error: error.message }))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    structuredLog('error', 'recommendation.request.failed', {
      requestId,
      error: error.message
    })
    return apiError(error, 500)
  }
}
